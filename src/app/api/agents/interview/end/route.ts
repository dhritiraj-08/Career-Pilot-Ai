import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { completeInterviewSession } from "@/lib/interview-complete";

interface RequestBody {
  sessionId?: string;
}

export const maxDuration = 60;

/** "End Interview Early" — runs the same wrap-up as finishing normally,
 * just against whichever questions were actually answered so far. */
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
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
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
    // Already finished (e.g. a double-click) — treat as a no-op success
    // rather than an error, since the end state the caller wants is
    // already true.
    return NextResponse.json({ sessionId });
  }

  const { usedFallback } = await completeInterviewSession(supabase, sessionId, session.job_title, session.created_at);

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "interview_agent",
    action: `Ended a mock interview for "${session.job_title ?? "a role"}" early`,
    status: "success",
    details: { usedFallback, endedEarly: true },
  });

  return NextResponse.json({ sessionId });
}
