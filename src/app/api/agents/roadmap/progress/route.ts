import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface RequestBody {
  stepId?: string;
  completed?: boolean;
}

const XP_PER_TASK = 10;

/**
 * Marks one roadmap task complete or incomplete (a toggle, so an
 * accidental click can be undone — the spec's "mark complete" is the
 * primary direction this supports), awards/revokes XP for it, and
 * returns the goal's recomputed overall progress.
 */
export async function PUT(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const stepId = body?.stepId?.trim();
  const completed = body?.completed;
  if (!stepId || typeof completed !== "boolean") {
    return NextResponse.json({ error: "stepId and completed (boolean) are required" }, { status: 400 });
  }

  const { data: step, error: stepError } = await supabase
    .from("roadmap_steps")
    .select("id, goal_id, status")
    .eq("id", stepId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (stepError || !step) {
    return NextResponse.json({ error: "Roadmap step not found" }, { status: 404 });
  }

  const wasCompleted = step.status === "completed";
  if (wasCompleted === completed) {
    // Already in the requested state (e.g. a double-click) — no-op,
    // just report current progress rather than erroring.
  } else {
    const { error: updateError } = await supabase
      .from("roadmap_steps")
      .update({
        status: completed ? "completed" : "not_started",
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", stepId);
    if (updateError) {
      console.error("[roadmap] failed to update step status:", updateError.message);
      return NextResponse.json({ error: "Couldn't update task" }, { status: 500 });
    }

    // XP is a genuinely separate, non-critical concern from task
    // completion itself — wrapped so a missing `xp` column (the
    // migration not having been run yet, see docs/schema.sql) can
    // never take down the actual task-completion request.
    try {
      const { data: profile } = await supabase.from("profiles").select("xp").eq("user_id", user.id).maybeSingle();
      const currentXp = profile?.xp ?? 0;
      const delta = completed ? XP_PER_TASK : -XP_PER_TASK;
      const nextXp = Math.max(0, currentXp + delta);
      await supabase.from("profiles").update({ xp: nextXp }).eq("user_id", user.id);
    } catch (err) {
      console.error("[roadmap] XP update skipped (has the profiles.xp migration been run?):", err);
    }
  }

  const { data: allSteps, error: stepsError } = await supabase
    .from("roadmap_steps")
    .select("status")
    .eq("goal_id", step.goal_id);

  if (stepsError || !allSteps) {
    return NextResponse.json({ error: "Couldn't recompute progress" }, { status: 500 });
  }

  const totalTasks = allSteps.length;
  const completedTasks = allSteps.filter((s) => s.status === "completed").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const { data: goal } = await supabase.from("career_goals").select("status").eq("id", step.goal_id).maybeSingle();
  let goalStatus = goal?.status ?? "in_progress";
  if (progressPercent === 100 && goalStatus !== "completed") {
    goalStatus = "completed";
    await supabase.from("career_goals").update({ status: "completed" }).eq("id", step.goal_id);
  } else if (progressPercent < 100 && goalStatus === "completed") {
    goalStatus = "in_progress";
    await supabase.from("career_goals").update({ status: "in_progress" }).eq("id", step.goal_id);
  }

  return NextResponse.json({ progressPercent, totalTasks, completedTasks, goalStatus });
}
