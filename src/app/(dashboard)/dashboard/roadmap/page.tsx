import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { RoadmapClient } from "@/components/roadmap/roadmap-client";
import type { GoalSummary } from "@/lib/validations/roadmap";

export default async function RoadmapPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: goalRows }, { data: stepRows }] = await Promise.all([
    supabase
      .from("career_goals")
      .select("id, title, description, target_date, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("roadmap_steps").select("goal_id, status").eq("user_id", user.id),
  ]);

  const goals: GoalSummary[] = (goalRows ?? []).map((g) => {
    const steps = (stepRows ?? []).filter((s) => s.goal_id === g.id);
    const totalTasks = steps.length;
    const completedTasks = steps.filter((s) => s.status === "completed").length;
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      targetDate: g.target_date,
      status: g.status as GoalSummary["status"],
      progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalTasks,
      completedTasks,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Career Roadmap</h1>
      <RoadmapClient initialGoals={goals} />
    </div>
  );
}
