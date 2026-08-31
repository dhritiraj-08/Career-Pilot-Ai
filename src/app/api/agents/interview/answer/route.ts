import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildAnswerEvaluationMessages, type InterviewCandidateContext } from "@/lib/ai/prompts/interview";
import { fallbackAnswerEvaluation } from "@/lib/ai/fallbacks/interview";
import { parseAnswerEvaluation, type InterviewQuestionItem } from "@/lib/validations/interview";
import { completeInterviewSession } from "@/lib/interview-complete";

interface RequestBody {
  sessionId?: string;
  questionId?: string;
  answerText?: string;
}

export const maxDuration = 60;

/**
 * Records one answer, scores it, and either returns the next question
 * or — if this was the last question — runs the session wrap-up
 * (holistic scoring across the full transcript) and marks the session
 * completed.
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
  const sessionId = body?.sessionId?.trim();
  const questionId = body?.questionId?.trim();
  // An empty answer is valid input here (user chose not to answer) —
  // scored honestly as such rather than rejected.
  const answerText = body?.answerText?.trim() ?? "";

  if (!sessionId || !questionId) {
    return NextResponse.json({ error: "sessionId and questionId are required" }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("id, job_title, status, created_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
  }
  if (session.status === "completed" || session.status === "cancelled") {
    return NextResponse.json({ error: "This interview has already ended" }, { status: 409 });
  }

  const { data: question, error: questionError } = await supabase
    .from("interview_questions")
    .select("id, question, question_type, order_index")
    .eq("id", questionId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (questionError || !question) {
    return NextResponse.json({ error: "Question not found for this session" }, { status: 404 });
  }

  const ctx: InterviewCandidateContext = {
    resumeText: "",
    jobDescription: "",
    targetRole: session.job_title ?? "this role",
    fullName: "",
    skills: [],
  };

  let evaluation = { score: 0, feedback: "" };
  try {
    const raw = await callOpenRouter({
      messages: buildAnswerEvaluationMessages(ctx, question.question, question.question_type ?? "technical", answerText),
      jsonMode: true,
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in answer-evaluation response");
    evaluation = parseAnswerEvaluation(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("[interview] answer evaluation failed:", err instanceof Error ? err.message : err);
    evaluation = fallbackAnswerEvaluation(answerText);
  }

  const { error: answerInsertError } = await supabase.from("interview_answers").insert({
    session_id: sessionId,
    question_id: questionId,
    answer_text: answerText || null,
    score: evaluation.score,
    feedback: evaluation.feedback,
  });
  if (answerInsertError) {
    console.error("[interview] failed to save answer:", answerInsertError.message);
    return NextResponse.json({ error: "Couldn't save answer" }, { status: 500 });
  }

  const { data: nextQuestionRow } = await supabase
    .from("interview_questions")
    .select("id, question, question_type, order_index")
    .eq("session_id", sessionId)
    .eq("order_index", question.order_index + 1)
    .maybeSingle();

  if (nextQuestionRow) {
    const nextQuestion: InterviewQuestionItem = {
      id: nextQuestionRow.id,
      question: nextQuestionRow.question,
      type: nextQuestionRow.question_type as InterviewQuestionItem["type"],
      orderIndex: nextQuestionRow.order_index,
    };
    return NextResponse.json({
      isComplete: false,
      score: evaluation.score,
      feedback: evaluation.feedback,
      nextQuestion,
    });
  }

  // Last question answered — run the session wrap-up.
  const { summary, usedFallback } = await completeInterviewSession(
    supabase,
    sessionId,
    session.job_title,
    session.created_at
  );

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "interview_agent",
    action: `Completed a mock interview for "${session.job_title ?? "a role"}" — scored ${summary.overallScore}/100`,
    status: "success",
    details: { usedFallback },
  });

  return NextResponse.json({
    isComplete: true,
    score: evaluation.score,
    feedback: evaluation.feedback,
    sessionId,
  });
}
