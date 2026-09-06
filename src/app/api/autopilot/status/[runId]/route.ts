import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Polled by the frontend while a run is in progress. Returns the run
 * row plus the orchestrator's recent activity log entries for it, for
 * the Activity Feed. */
export async function GET(_request: Request, { params }: { params: { runId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: run, error: runError } = await supabase
    .from("autopilot_runs")
    .select("*")
    .eq("id", params.runId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (runError || !run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const { data: activity } = await supabase
    .from("agent_activities")
    .select("id, action, status, created_at, details")
    .eq("user_id", user.id)
    .eq("agent_name", "orchestrator")
    .contains("details", { run_id: params.runId })
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ run, activity: activity ?? [] });
}
