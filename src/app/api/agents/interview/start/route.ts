import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { runInterviewStart } from "@/lib/agents/interview";
import { INTERVIEW_TYPES, QUESTION_COUNTS, type InterviewType } from "@/lib/validations/interview";

interface RequestBody {
  resumeId?: string;
  jobDescription?: string;
  targetRole?: string;
  interviewType?: string;
  questionCount?: number;
}

// Question generation + (for a returning resume) on-demand PDF
// extraction can both take a few seconds.
export const maxDuration = 60;

/**
 * Starts a mock interview: generates the full question set up front
 * (one LLM call, not one per question), saves the session and all
 * questions, and returns the first question. The actual work lives in
 * lib/agents/interview.ts — the Autopilot orchestrator (api/autopilot/
 * approve) calls that same function directly when a job application is
 * approved, rather than hitting this route over HTTP.
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
  const jobDescription = body?.jobDescription?.trim() ?? "";
  const targetRole = body?.targetRole?.trim();
  const interviewType = body?.interviewType as InterviewType | undefined;
  const questionCount = body?.questionCount;

  if (!resumeId || !targetRole) {
    return NextResponse.json({ error: "resumeId and targetRole are required" }, { status: 400 });
  }
  if (!interviewType || !INTERVIEW_TYPES.includes(interviewType)) {
    return NextResponse.json({ error: "interviewType must be technical, hr, or mixed" }, { status: 400 });
  }
  if (!questionCount || !QUESTION_COUNTS.includes(questionCount as (typeof QUESTION_COUNTS)[number])) {
    return NextResponse.json({ error: "questionCount must be 5, 10, or 15" }, { status: 400 });
  }

  const result = await runInterviewStart(supabase, user.id, { resumeId, targetRole, jobDescription, interviewType, questionCount });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
