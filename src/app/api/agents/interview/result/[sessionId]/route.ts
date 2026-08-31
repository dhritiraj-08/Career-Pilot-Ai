import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { decodeFeedbackSummary } from "@/lib/validations/interview";

export interface InterviewResultQuestion {
  id: string;
  question: string;
  type: string;
  orderIndex: number;
  answer: {
    text: string | null;
    score: number | null;
    feedback: string | null;
  } | null;
}

export interface InterviewResultResponse {
  session: {
    id: string;
    jobTitle: string | null;
    company: string | null;
    status: string;
    overallScore: number | null;
    technicalScore: number | null;
    communicationScore: number | null;
    confidenceScore: number | null;
    durationMinutes: number | null;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    summary: string;
    createdAt: string;
    completedAt: string | null;
  };
  questions: InterviewResultQuestion[];
}

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select(
      "id, job_title, company, status, overall_score, technical_score, communication_score, aptitude_score, feedback_summary, duration_minutes, created_at, completed_at"
    )
    .eq("id", params.sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
  }

  const { data: questionRows, error: questionsError } = await supabase
    .from("interview_questions")
    .select("id, question, question_type, order_index, interview_answers(answer_text, score, feedback)")
    .eq("session_id", session.id)
    .order("order_index", { ascending: true });

  if (questionsError) {
    console.error("[interview] failed to load questions for result:", questionsError.message);
    return NextResponse.json({ error: "Couldn't load interview details" }, { status: 500 });
  }

  const questions: InterviewResultQuestion[] = (questionRows ?? []).map((row) => {
    const answerRow = Array.isArray(row.interview_answers) ? row.interview_answers[0] : row.interview_answers;
    return {
      id: row.id,
      question: row.question,
      type: row.question_type ?? "technical",
      orderIndex: row.order_index,
      answer: answerRow
        ? { text: answerRow.answer_text, score: answerRow.score, feedback: answerRow.feedback }
        : null,
    };
  });

  const decoded = decodeFeedbackSummary(session.feedback_summary);

  const result: InterviewResultResponse = {
    session: {
      id: session.id,
      jobTitle: session.job_title,
      company: session.company,
      status: session.status,
      overallScore: session.overall_score,
      technicalScore: session.technical_score,
      communicationScore: session.communication_score,
      confidenceScore: session.aptitude_score,
      durationMinutes: session.duration_minutes,
      strengths: decoded.strengths,
      weaknesses: decoded.weaknesses,
      recommendations: decoded.recommendations,
      summary: decoded.summary,
      createdAt: session.created_at,
      completedAt: session.completed_at,
    },
    questions,
  };

  return NextResponse.json(result);
}
