import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { runRoadmapGeneration } from "@/lib/agents/roadmap";
import { GOAL_TYPES, type GoalType } from "@/lib/validations/roadmap";

interface RequestBody {
  goalId?: string; // present = regenerate the roadmap for an existing goal instead of creating a new one
  title?: string;
  description?: string;
  targetDate?: string;
  goalType?: string;
}

export const maxDuration = 60;

/**
 * Creates a new career goal and generates its week-by-week roadmap, or
 * (when goalId is given) regenerates the roadmap for an existing goal
 * — the right panel's own "AI Generate Roadmap" button reuses this
 * rather than duplicating the generation logic, replacing whatever
 * steps existed before. The actual work lives in
 * lib/agents/roadmap.ts — the Autopilot orchestrator (api/autopilot/
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
  const existingGoalId = body?.goalId?.trim();

  // goalType isn't persisted anywhere (see lib/validations/roadmap.ts —
  // it's pure prompt-steering, career_goals has no column for it and
  // nothing displays it back), so a regenerate call for an
  // already-existing goal has no way to know what type it originally
  // was. Required when creating a new goal; defaults to "job" on
  // regenerate rather than forcing the UI to ask again for something
  // it can't actually look up.
  const rawGoalType = body?.goalType as GoalType | undefined;
  if (!existingGoalId && (!rawGoalType || !GOAL_TYPES.includes(rawGoalType))) {
    return NextResponse.json({ error: "goalType must be a valid goal type" }, { status: 400 });
  }
  const goalType: GoalType = rawGoalType && GOAL_TYPES.includes(rawGoalType) ? rawGoalType : "job";

  const result = await runRoadmapGeneration(supabase, user.id, {
    goalId: existingGoalId,
    title: body?.title,
    description: body?.description,
    targetDate: body?.targetDate?.trim() || null,
    goalType,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
