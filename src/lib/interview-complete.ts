import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildSessionSummaryMessages, type InterviewCandidateContext, type TranscriptEntry } from "@/lib/ai/prompts/interview";
import { fallbackSessionSummary } from "@/lib/ai/fallbacks/interview";
import { parseSessionSummary, encodeFeedbackSummary } from "@/lib/validations/interview";

/**
 * Shared by POST /api/agents/interview/answer (reaching the last
 * question) and POST /api/agents/interview/end (ending early): builds
 * the full transcript so far, runs the holistic wrap-up LLM call (with
 * a real deterministic fallback), and marks the session completed.
 * Used for both a normal finish and an early end — an early end just
 * means the transcript is shorter, not a different code path.
 */
export async function completeInterviewSession(
  supabase: SupabaseClient,
  sessionId: string,
  jobTitle: string | null,
  createdAt: string
) {
  const { data: rows } = await supabase
    .from("interview_questions")
    .select("question, question_type, order_index, interview_answers(answer_text, score)")
    .eq("session_id", sessionId)
    .order("order_index", { ascending: true });

  const transcript: TranscriptEntry[] = (rows ?? [])
    .map((r: { question: string; question_type: string | null; interview_answers: unknown }) => {
      const answerRaw = r.interview_answers;
      const answer = Array.isArray(answerRaw) ? answerRaw[0] : answerRaw;
      return {
        question: r.question,
        type: r.question_type ?? "technical",
        answer: (answer as { answer_text?: string; score?: number } | undefined)?.answer_text ?? "",
        score: (answer as { answer_text?: string; score?: number } | undefined)?.score ?? 0,
        answered: Boolean(answer),
      };
    })
    // Unanswered questions (only possible via an early end) don't belong
    // in the scored transcript — nothing was said for the LLM to assess.
    .filter((t) => t.answered)
    .map(({ question, type, answer, score }) => ({ question, type, answer, score }));

  const allScores = transcript.map((t) => t.score);
  const technicalScores = transcript.filter((t) => t.type === "technical").map((t) => t.score);
  const hrScores = transcript.filter((t) => t.type !== "technical").map((t) => t.score);

  const ctx: InterviewCandidateContext = {
    resumeText: "",
    jobDescription: "",
    targetRole: jobTitle ?? "this role",
    fullName: "",
    skills: [],
  };

  let summary;
  let usedFallback = false;
  if (transcript.length === 0) {
    // Ended before answering anything — nothing for even the fallback
    // heuristic to work from.
    usedFallback = true;
    summary = fallbackSessionSummary({ scores: [], technicalScores: [], hrScores: [] });
    summary = {
      ...summary,
      overallScore: 0,
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      summary: "This interview ended before any questions were answered.",
      strengths: [],
      weaknesses: [],
      recommendations: ["Start a new interview when you're ready to try again."],
    };
  } else {
    try {
      const raw = await callOpenRouter({
        messages: buildSessionSummaryMessages(ctx, transcript),
        jsonMode: true,
      });
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in session-summary response");
      summary = parseSessionSummary(JSON.parse(jsonMatch[0]));
    } catch (err) {
      console.error("[interview] session summary failed:", err instanceof Error ? err.message : err);
      usedFallback = true;
      summary = fallbackSessionSummary({ scores: allScores, technicalScores, hrScores });
    }
  }

  const durationMinutes = Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));

  await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      overall_score: summary.overallScore,
      technical_score: summary.technicalScore,
      communication_score: summary.communicationScore,
      // aptitude_score stores "confidence" — see lib/validations/interview.ts.
      aptitude_score: summary.confidenceScore,
      feedback_summary: encodeFeedbackSummary(summary),
      duration_minutes: durationMinutes,
    })
    .eq("id", sessionId);

  return { summary, usedFallback };
}
