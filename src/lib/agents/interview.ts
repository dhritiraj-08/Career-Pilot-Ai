import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractText } from "unpdf";

import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildQuestionGenerationMessages, type InterviewCandidateContext } from "@/lib/ai/prompts/interview";
import { fallbackQuestions } from "@/lib/ai/fallbacks/interview";
import { parseGeneratedQuestions, type InterviewType, type InterviewQuestionItem } from "@/lib/validations/interview";

export interface RunInterviewStartParams {
  resumeId: string;
  targetRole: string;
  jobDescription: string;
  interviewType: InterviewType;
  questionCount: number;
  /** Not part of the original route's request body — the route never
   * had a caller that knew the company name. Autopilot does (it's
   * drafting a real application for a real listing), and the
   * interview_sessions table already has a company column that the
   * original route simply never populated. */
  company?: string;
}

export type RunInterviewStartResult =
  | { sessionId: string; totalQuestions: number; question: InterviewQuestionItem; usedFallback: boolean }
  | { error: string; status: number };

/**
 * The Interview Agent's "start a mock interview" work, extracted out of
 * api/agents/interview/start/route.ts so the Autopilot orchestrator can
 * call it directly once a job application is approved — same
 * generate-the-whole-question-set-up-front design as before, unchanged.
 * The route is now a thin wrapper around this.
 */
export async function runInterviewStart(
  supabase: SupabaseClient,
  userId: string,
  params: RunInterviewStartParams
): Promise<RunInterviewStartResult> {
  const { resumeId, targetRole, jobDescription, interviewType, questionCount, company } = params;

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, file_url, parsed_content")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (resumeError || !resume) {
    return { error: "Resume not found", status: 404 };
  }

  const existingParsedContent = (resume.parsed_content ?? {}) as Record<string, unknown>;
  let resumeText = typeof existingParsedContent.extracted_text === "string" ? existingParsedContent.extracted_text : "";

  if (!resumeText) {
    const { data: fileBlob, error: downloadError } = await supabase.storage.from("resumes").download(resume.file_url);
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

  const [{ data: profile }, { data: skillRows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle(),
    supabase.from("skills").select("name").eq("user_id", userId),
  ]);

  const ctx: InterviewCandidateContext = {
    resumeText,
    jobDescription,
    targetRole,
    fullName: profile?.full_name ?? "",
    skills: (skillRows ?? []).map((s) => s.name),
  };

  let generatedQuestions: { question: string; type: "technical" | "behavioral" | "hr" }[] = [];
  let usedFallback = false;
  try {
    const raw = await callOpenRouter({
      messages: buildQuestionGenerationMessages(ctx, interviewType, questionCount),
      jsonMode: true,
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in question-generation response");
    generatedQuestions = parseGeneratedQuestions(JSON.parse(jsonMatch[0]), questionCount);
    if (generatedQuestions.length === 0) throw new Error("No questions parsed from response");
  } catch (err) {
    console.error("[interview] question generation failed:", err instanceof Error ? err.message : err);
    usedFallback = true;
    generatedQuestions = fallbackQuestions(interviewType, questionCount);
  }

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: userId,
      resume_id: resumeId,
      job_title: targetRole,
      company: company || null,
      job_description: jobDescription || null,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("[interview] failed to create session:", sessionError?.message);
    return { error: "Couldn't start interview", status: 500 };
  }

  const { data: insertedQuestions, error: questionsError } = await supabase
    .from("interview_questions")
    .insert(
      generatedQuestions.map((q, index) => ({
        session_id: session.id,
        question: q.question,
        question_type: q.type,
        order_index: index,
      }))
    )
    .select("id, question, question_type, order_index")
    .order("order_index", { ascending: true });

  if (questionsError || !insertedQuestions || insertedQuestions.length === 0) {
    console.error("[interview] failed to save questions:", questionsError?.message);
    // Clean up the orphaned session rather than leaving a session with
    // no questions a user could get stuck on.
    await supabase.from("interview_sessions").delete().eq("id", session.id);
    return { error: "Couldn't generate interview questions", status: 500 };
  }

  await supabase.from("agent_activities").insert({
    user_id: userId,
    agent_name: "interview_agent",
    action: `Started a ${interviewType} mock interview for "${targetRole}" (${insertedQuestions.length} questions)`,
    status: "success",
    details: { usedFallback, questionCount: insertedQuestions.length },
  });

  const first = insertedQuestions[0];
  const firstQuestion: InterviewQuestionItem = {
    id: first.id,
    question: first.question,
    type: first.question_type as InterviewQuestionItem["type"],
    orderIndex: first.order_index,
  };

  return {
    sessionId: session.id,
    totalQuestions: insertedQuestions.length,
    question: firstQuestion,
    usedFallback,
  };
}
