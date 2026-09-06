import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildRoadmapGenerationMessages, type RoadmapCandidateContext } from "@/lib/ai/prompts/roadmap";
import { fallbackRoadmap } from "@/lib/ai/fallbacks/roadmap";
import { parseGeneratedRoadmap, GOAL_TYPES, type GoalType, type RoadmapWeek } from "@/lib/validations/roadmap";

interface RequestBody {
  goalId?: string; // present = regenerate the roadmap for an existing goal instead of creating a new one
  title?: string;
  description?: string;
  targetDate?: string;
  goalType?: string;
}

const MIN_WEEKS = 2;
const MAX_WEEKS = 24;
const DEFAULT_WEEKS = 4;

function computeWeekCount(targetDate: string | null): number {
  if (!targetDate) return DEFAULT_WEEKS;
  const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(days) || days <= 0) return DEFAULT_WEEKS;
  return Math.max(MIN_WEEKS, Math.min(Math.ceil(days / 7), MAX_WEEKS));
}

export const maxDuration = 60;

/**
 * Creates a new career goal and generates its week-by-week roadmap, or
 * (when goalId is given) regenerates the roadmap for an existing goal
 * — the right panel's own "AI Generate Roadmap" button reuses this
 * rather than duplicating the generation logic, replacing whatever
 * steps existed before.
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
  const title = body?.title?.trim();
  const description = body?.description?.trim() ?? "";
  const targetDate = body?.targetDate?.trim() || null;
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

  if (!existingGoalId && !title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  let goalId: string;
  let resolvedTitle = title ?? "";
  let resolvedDescription = description;
  let resolvedTargetDate = targetDate;

  if (existingGoalId) {
    const { data: existingGoal, error: goalFetchError } = await supabase
      .from("career_goals")
      .select("id, title, description, target_date")
      .eq("id", existingGoalId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (goalFetchError || !existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    goalId = existingGoal.id;
    resolvedTitle = existingGoal.title;
    resolvedDescription = existingGoal.description ?? "";
    resolvedTargetDate = existingGoal.target_date;
  } else {
    const { data: newGoal, error: goalInsertError } = await supabase
      .from("career_goals")
      .insert({
        user_id: user.id,
        title: resolvedTitle,
        description: resolvedDescription || null,
        target_date: resolvedTargetDate,
        status: "in_progress",
      })
      .select("id")
      .single();
    if (goalInsertError || !newGoal) {
      console.error("[roadmap] failed to create goal:", goalInsertError?.message);
      return NextResponse.json({ error: "Couldn't create goal" }, { status: 500 });
    }
    goalId = newGoal.id;
  }

  const [{ data: profile }, { data: skillRows }, { data: educationRows }, { data: preferences }] = await Promise.all([
    supabase.from("profiles").select("full_name, current_job_role, years_experience").eq("user_id", user.id).maybeSingle(),
    supabase.from("skills").select("name").eq("user_id", user.id),
    supabase.from("education").select("institution, degree, field").eq("user_id", user.id),
    supabase.from("job_preferences").select("target_roles").eq("user_id", user.id).maybeSingle(),
  ]);

  const ctx: RoadmapCandidateContext = {
    fullName: profile?.full_name ?? "",
    currentJobRole: profile?.current_job_role ?? "",
    yearsExperience: profile?.years_experience ?? 0,
    skills: (skillRows ?? []).map((s) => s.name),
    targetRoles: preferences?.target_roles ?? [],
    education: (educationRows ?? []).map((e) => [e.degree, e.field, e.institution].filter(Boolean).join(" ")),
  };

  const weekCount = computeWeekCount(resolvedTargetDate);

  let generatedWeeks;
  let usedFallback = false;
  try {
    const raw = await callOpenRouter({
      messages: buildRoadmapGenerationMessages(
        ctx,
        { title: resolvedTitle, description: resolvedDescription, type: goalType, targetDate: resolvedTargetDate },
        weekCount
      ),
      jsonMode: true,
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in roadmap-generation response");
    generatedWeeks = parseGeneratedRoadmap(JSON.parse(jsonMatch[0]), weekCount);
    if (generatedWeeks.length === 0) throw new Error("No weeks parsed from response");
  } catch (err) {
    console.error("[roadmap] generation failed:", err instanceof Error ? err.message : err);
    usedFallback = true;
    generatedWeeks = fallbackRoadmap(goalType, weekCount);
  }

  // Regenerating replaces the old plan outright rather than appending
  // to it — the old steps (and any progress on them) are superseded.
  if (existingGoalId) {
    const { error: deleteError } = await supabase.from("roadmap_steps").delete().eq("goal_id", goalId);
    if (deleteError) {
      console.error("[roadmap] failed to clear old steps before regenerating:", deleteError.message);
      return NextResponse.json({ error: "Couldn't regenerate roadmap" }, { status: 500 });
    }
  }

  const today = new Date();
  const rows = generatedWeeks.flatMap((week, weekIdx) => {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + week.weekNumber * 7);
    return week.tasks.map((task, taskIdx) => ({
      goal_id: goalId,
      user_id: user.id,
      title: task,
      order_index: weekIdx * 100 + taskIdx, // generous spacing — never collides across weeks
      week_number: week.weekNumber,
      focus_area: week.focusArea,
      due_date: dueDate.toISOString().slice(0, 10),
      status: "not_started" as const,
    }));
  });

  const { data: insertedSteps, error: stepsInsertError } = await supabase
    .from("roadmap_steps")
    .insert(rows)
    .select("id, title, order_index, status, due_date, completed_at, week_number, focus_area");

  if (stepsInsertError || !insertedSteps) {
    console.error("[roadmap] failed to save steps:", stepsInsertError?.message);
    if (!existingGoalId) await supabase.from("career_goals").delete().eq("id", goalId);
    return NextResponse.json({ error: "Couldn't save roadmap steps" }, { status: 500 });
  }

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    // No dedicated "roadmap_agent" value in agent_activities' check
    // constraint — this is a broad career-planning agent orchestrating
    // across the goal, so "orchestrator" is the closest honest fit
    // rather than requesting yet another constraint migration for a
    // logging label alone.
    agent_name: "orchestrator",
    action: `${existingGoalId ? "Regenerated" : "Generated"} a ${weekCount}-week roadmap for "${resolvedTitle}"`,
    status: "success",
    details: { usedFallback, weekCount, goalId },
  });

  const weeksByNumber = new Map<number, RoadmapWeek>();
  for (const row of insertedSteps) {
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

  return NextResponse.json({ goalId, weeks, usedFallback });
}
