import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { RoadmapWeek } from "@/lib/validations/roadmap";

export interface RoadmapGoalResponse {
  goal: {
    id: string;
    title: string;
    description: string | null;
    targetDate: string | null;
    status: string;
    createdAt: string;
  };
  weeks: RoadmapWeek[];
}

/** Fetches one goal plus its full week-grouped roadmap — used both to
 * load a goal selected from the left panel and to refresh the right
 * panel after a task is toggled. */
export async function GET(request: Request, { params }: { params: { goalId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: goal, error: goalError } = await supabase
    .from("career_goals")
    .select("id, title, description, target_date, status, created_at")
    .eq("id", params.goalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (goalError || !goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const { data: steps, error: stepsError } = await supabase
    .from("roadmap_steps")
    .select("id, title, status, due_date, completed_at, order_index, week_number, focus_area")
    .eq("goal_id", goal.id)
    .order("order_index", { ascending: true });

  if (stepsError) {
    console.error("[roadmap] failed to load steps:", stepsError.message);
    return NextResponse.json({ error: "Couldn't load roadmap" }, { status: 500 });
  }

  const weeksByNumber = new Map<number, RoadmapWeek>();
  for (const row of steps ?? []) {
    const wn = row.week_number ?? 1;
    if (!weeksByNumber.has(wn)) {
      weeksByNumber.set(wn, { weekNumber: wn, focusArea: row.focus_area ?? `Week ${wn}`, tasks: [] });
    }
    weeksByNumber.get(wn)!.tasks.push({
      id: row.id,
      title: row.title,
      status: row.status as RoadmapWeek["tasks"][number]["status"],
      dueDate: row.due_date,
      completedAt: row.completed_at,
      orderIndex: row.order_index,
    });
  }
  const weeks = Array.from(weeksByNumber.values()).sort((a, b) => a.weekNumber - b.weekNumber);

  const result: RoadmapGoalResponse = {
    goal: {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetDate: goal.target_date,
      status: goal.status,
      createdAt: goal.created_at,
    },
    weeks,
  };

  return NextResponse.json(result);
}
