import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractText } from "unpdf";

import { callOpenRouter } from "@/lib/ai/openrouter";
import {
  buildAnalysisMessages,
  buildTailoredResumeMessages,
  buildCoverLetterMessages,
  type CandidateContext,
} from "@/lib/ai/prompts/resume-architect";
import {
  fallbackAnalysis,
  fallbackTailoredResume,
  fallbackCoverLetter,
} from "@/lib/ai/fallbacks/resume-architect";
import {
  parseAnalysisResponse,
  encodeRecommendation,
  type ResumeArchitectResult,
} from "@/lib/validations/resume-architect";

export interface RunResumeArchitectParams {
  resumeId: string;
  jobDescription: string;
  targetRole: string;
}

export type RunResumeArchitectResult =
  | (ResumeArchitectResult & { resumeText: string })
  | { error: string; status: number };

/**
 * The Resume Architect agent's actual work, extracted out of
 * api/agents/resume-architect/route.ts so the Autopilot orchestrator
 * can call it directly (in-process) once per matched job — same
 * three-phase-with-independent-fallbacks design as before, unchanged.
 * The route is now a thin wrapper around this.
 *
 * Also returns the extracted resumeText (not part of the original
 * route's response) — the orchestrator needs it again right after to
 * draft the application email, and re-extracting would just repeat the
 * same download+parse this function already did.
 */
export async function runResumeArchitectAnalysis(
  supabase: SupabaseClient,
  userId: string,
  params: RunResumeArchitectParams
): Promise<RunResumeArchitectResult> {
  const { resumeId, jobDescription, targetRole } = params;

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, file_url, parsed_content")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (resumeError || !resume) {
    return { error: "Resume not found", status: 404 };
  }

  // Resumes don't have extracted text stored yet (parsed_content only
  // ever held file_size_bytes/mime_type) — extract it here on demand,
  // then cache it back into the same jsonb column so a second analysis
  // of the same resume skips re-extraction.
  const existingParsedContent = (resume.parsed_content ?? {}) as Record<string, unknown>;
  let resumeText = typeof existingParsedContent.extracted_text === "string"
    ? existingParsedContent.extracted_text
    : "";

  if (!resumeText) {
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(resume.file_url);

    if (downloadError || !fileBlob) {
      return { error: "Couldn't read resume file", status: 500 };
    }

    try {
      const buffer = new Uint8Array(await fileBlob.arrayBuffer());
      const { text } = await extractText(buffer, { mergePages: true });
      resumeText = text.trim();

      if (resumeText) {
        await supabase
          .from("resumes")
          .update({ parsed_content: { ...existingParsedContent, extracted_text: resumeText } })
          .eq("id", resumeId);
      }
    } catch {
      resumeText = "";
    }
  }

  const [{ data: profile }, { data: skillsRows }, { data: educationRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, current_job_role, current_company, years_experience")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("skills").select("name").eq("user_id", userId),
    supabase.from("education").select("institution, degree, field").eq("user_id", userId),
  ]);

  const ctx: CandidateContext = {
    resumeText,
    jobDescription,
    targetRole,
    fullName: profile?.full_name ?? "",
    currentJobRole: profile?.current_job_role ?? "",
    currentCompany: profile?.current_company ?? "",
    yearsExperience: profile?.years_experience ?? 0,
    skills: (skillsRows ?? []).map((s) => s.name),
    education: (educationRows ?? []).map((e) =>
      [e.degree, e.field, e.institution].filter(Boolean).join(" ")
    ),
  };

  let usedFallback = false;

  // Phase 1: analysis (JSON mode)
  let analysis;
  try {
    const raw = await callOpenRouter({ messages: buildAnalysisMessages(ctx), jsonMode: true });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in analysis response");
    analysis = parseAnalysisResponse(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("[resume-architect] analysis phase failed:", err instanceof Error ? err.message : err);
    usedFallback = true;
    analysis = fallbackAnalysis(ctx);
  }

  // Phase 2: tailored resume (plain text)
  let tailoredResumeContent: string;
  try {
    tailoredResumeContent = await callOpenRouter({ messages: buildTailoredResumeMessages(ctx) });
  } catch (err) {
    console.error("[resume-architect] tailored resume phase failed:", err instanceof Error ? err.message : err);
    usedFallback = true;
    tailoredResumeContent = fallbackTailoredResume(ctx);
  }

  // Phase 3: cover letter (plain text)
  let coverLetterContent: string;
  try {
    coverLetterContent = await callOpenRouter({ messages: buildCoverLetterMessages(ctx) });
  } catch (err) {
    console.error("[resume-architect] cover letter phase failed:", err instanceof Error ? err.message : err);
    usedFallback = true;
    coverLetterContent = fallbackCoverLetter(ctx);
  }

  // Save the analysis. scoring_breakdown is jsonb, so used_fallback rides
  // along there — resume_analyses has no dedicated flag column for it.
  const { error: analysisInsertError } = await supabase.from("resume_analyses").insert({
    user_id: userId,
    resume_id: resumeId,
    target_role: targetRole,
    ats_score: analysis.atsScore,
    scoring_breakdown: { ...analysis.scoreBreakdown, used_fallback: usedFallback },
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    recommendations: analysis.recommendations.map(encodeRecommendation),
    keywords_found: analysis.keywordsFound,
    keywords_missing: analysis.keywordsMissing,
  });
  if (analysisInsertError) {
    console.error("[resume-architect] failed to save resume_analyses:", analysisInsertError.message);
  }

  const { error: coverLetterInsertError } = await supabase.from("cover_letters").insert({
    user_id: userId,
    resume_id: resumeId,
    target_role: targetRole,
    job_description: jobDescription,
    content: coverLetterContent,
  });
  if (coverLetterInsertError) {
    console.error("[resume-architect] failed to save cover_letters:", coverLetterInsertError.message);
  }

  return {
    candidateName: ctx.fullName || "Your Name",
    atsScore: analysis.atsScore,
    scoreBreakdown: analysis.scoreBreakdown,
    keywordsFound: analysis.keywordsFound,
    keywordsMissing: analysis.keywordsMissing,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    recommendations: analysis.recommendations,
    tailoredResumeContent,
    coverLetterContent,
    usedFallback,
    resumeText,
  };
}
