import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { InterviewQuestionItem } from "@/lib/validations/interview";

/**
 * Resumes an existing interview session — added so a link to
 * /dashboard/interview?sessionId=... (Autopilot's auto-created
 * interview-prep sessions, see api/autopilot/approve) can actually
 * drop the user into the room instead of a blank setup form. Returns
 * the same shape as POST .../start so InterviewClient can treat both
 * identically. Finds the first question with no interview_answers row
 * yet — for a freshly auto-created session that's just question 1, but
 * this works generally for resuming a session left mid-interview too.
 */
export async function GET(_request: Request, { params }: { params: { sessionId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("id, status")
    .eq("id", params.sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
  }

  const { data: questions } = await supabase
    .from("interview_questions")
    .select("id, question, question_type, order_index")
    .eq("session_id", session.id)
    .order("order_index", { ascending: true });

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "This session has no questions" }, { status: 404 });
  }

  if (session.status === "completed" || session.status === "cancelled") {
    return NextResponse.json({ isComplete: true, sessionId: session.id });
  }

  const { data: answers } = await supabase.from("interview_answers").select("question_id").eq("session_id", session.id);
  const answeredIds = new Set((answers ?? []).map((a) => a.question_id));
  const next = questions.find((q) => !answeredIds.has(q.id));

  if (!next) {
    return NextResponse.json({ isComplete: true, sessionId: session.id });
  }

  const question: InterviewQuestionItem = {
    id: next.id,
    question: next.question,
    type: next.question_type as InterviewQuestionItem["type"],
    orderIndex: next.order_index,
  };

  return NextResponse.json({ sessionId: session.id, totalQuestions: questions.length, question, usedFallback: false });
}
