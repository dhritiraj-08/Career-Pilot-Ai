import { NextResponse } from "next/server";
import { extractText } from "unpdf";

import { createClient } from "@/lib/supabase/server";
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

interface RequestBody {
  resumeId?: string;
  jobDescription?: string;
  targetRole?: string;
}

// Three sequential LLM calls (see below) can run long. No effect
// locally, but declares intent for a future Vercel deployment where
// serverless functions have a platform execution-time cap.
export const maxDuration = 60;

/**
 * Three separate LLM calls rather than one giant JSON response:
 * analysis (JSON mode, small/constrained output — reliable) then two
 * plain-text generations (tailored resume, cover letter — forcing JSON
 * mode around a full resume/cover-letter body is exactly where a
 * free-tier model is most likely to produce broken JSON via truncation
 * or bad escaping). Each phase has its own try/catch and falls back
 * independently, so one phase failing doesn't take down the others.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const resumeId = body?.resumeId?.trim();
  const jobDescription = body?.jobDescription?.trim();
  const targetRole = body?.targetRole?.trim();

  if (!resumeId || !jobDescription || !targetRole) {
    return NextResponse.json(
      { error: "resumeId, jobDescription, and targetRole are all required" },
      { status: 400 }
    );
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, file_url, parsed_content")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (resumeError || !resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  // Resumes don't have extracted text stored yet (parsed_content only
  // ever held file_size_bytes/mime_type — see Phase 4/5) — extract it
  // here on demand, then cache it back into the same jsonb column so a
  // second analysis of the same resume skips re-extraction.
  const existingParsedContent = (resume.parsed_content ?? {}) as Record<string, unknown>;
  let resumeText = typeof existingParsedContent.extracted_text === "string"
    ? existingParsedContent.extracted_text
    : "";

  if (!resumeText) {
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(resume.file_url);

    if (downloadError || !fileBlob) {
      return NextResponse.json({ error: "Couldn't read resume file" }, { status: 500 });
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
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("skills").select("name").eq("user_id", user.id),
    supabase.from("education").select("institution, degree, field").eq("user_id", user.id),
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
    user_id: user.id,
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
    user_id: user.id,
    resume_id: resumeId,
    target_role: targetRole,
    job_description: jobDescription,
    content: coverLetterContent,
  });
  if (coverLetterInsertError) {
    console.error("[resume-architect] failed to save cover_letters:", coverLetterInsertError.message);
  }

  const result: ResumeArchitectResult = {
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
  };

  return NextResponse.json(result);
}
