"use client";

import * as React from "react";
import { toast } from "sonner";

import type { GoalSummary, RoadmapWeek } from "@/lib/validations/roadmap";
import type { RoadmapGoalResponse } from "@/app/api/agents/roadmap/[goalId]/route";
import { GoalListPanel } from "./goal-list-panel";
import { RoadmapView } from "./roadmap-view";
import { AddGoalModal, type NewGoalValues } from "./add-goal-modal";

interface RoadmapClientProps {
  initialGoals: GoalSummary[];
}

function computeProgress(weeks: RoadmapWeek[]): { totalTasks: number; completedTasks: number; progressPercent: number } {
  const totalTasks = weeks.reduce((sum, w) => sum + w.tasks.length, 0);
  const completedTasks = weeks.reduce((sum, w) => sum + w.tasks.filter((t) => t.status === "completed").length, 0);
  return { totalTasks, completedTasks, progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 };
}

export function RoadmapClient({ initialGoals }: RoadmapClientProps) {
  const [goals, setGoals] = React.useState<GoalSummary[]>(initialGoals);
  const [selectedGoalId, setSelectedGoalId] = React.useState<string | null>(initialGoals[0]?.id ?? null);
  const [selectedDetail, setSelectedDetail] = React.useState<RoadmapGoalResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [pendingTaskId, setPendingTaskId] = React.useState<string | null>(null);

  const loadGoalDetail = React.useCallback(async (goalId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/agents/roadmap/${goalId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't load roadmap");
      setSelectedDetail(data as RoadmapGoalResponse);
    } catch (err) {
      toast.error("Couldn't load roadmap", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedGoalId) loadGoalDetail(selectedGoalId);
  }, [selectedGoalId, loadGoalDetail]);

  const handleSelectGoal = (goalId: string) => {
    setSelectedGoalId(goalId);
  };

  const handleAddGoal = async (values: NewGoalValues) => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/agents/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      const weeks: RoadmapWeek[] = data.weeks;
      const { totalTasks, completedTasks, progressPercent } = computeProgress(weeks);

      const newGoal: GoalSummary = {
        id: data.goalId,
        title: values.title,
        description: values.description || null,
        targetDate: values.targetDate || null,
        status: "in_progress",
        progressPercent,
        totalTasks,
        completedTasks,
      };
      setGoals((prev) => [newGoal, ...prev]);
      setSelectedGoalId(newGoal.id);
      setSelectedDetail({
        goal: {
          id: newGoal.id,
          title: newGoal.title,
          description: newGoal.description,
          targetDate: newGoal.targetDate,
          status: newGoal.status,
          createdAt: new Date().toISOString(),
        },
        weeks,
      });
      setIsModalOpen(false);

      if (data.usedFallback) {
        toast.warning("AI generation was limited", {
          description: "We saved a standard plan for this goal type — try regenerating shortly for a fully tailored one.",
        });
      } else {
        toast.success("Goal created and roadmap generated");
      }
    } catch (err) {
      toast.error("Couldn't create goal", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedGoalId) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/agents/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: selectedGoalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      const weeks: RoadmapWeek[] = data.weeks;
      setSelectedDetail((prev) => (prev ? { ...prev, weeks } : prev));

      const { progressPercent, totalTasks, completedTasks } = computeProgress(weeks);
      setGoals((prev) =>
        prev.map((g) => (g.id === selectedGoalId ? { ...g, progressPercent, totalTasks, completedTasks, status: "in_progress" } : g))
      );

      toast.success(data.usedFallback ? "Standard roadmap generated" : "Roadmap generated");
    } catch (err) {
      toast.error("Couldn't generate roadmap", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!selectedGoalId || !selectedDetail) return;
    setPendingTaskId(taskId);

    // Optimistic update — reverted below if the request fails.
    const previousWeeks = selectedDetail.weeks;
    const optimisticWeeks = previousWeeks.map((w) => ({
      ...w,
      tasks: w.tasks.map((t) =>
        t.id === taskId ? { ...t, status: completed ? ("completed" as const) : ("not_started" as const) } : t
      ),
    }));
    setSelectedDetail({ ...selectedDetail, weeks: optimisticWeeks });

    try {
      const res = await fetch("/api/agents/roadmap/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: taskId, completed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoalId
            ? { ...g, progressPercent: data.progressPercent, totalTasks: data.totalTasks, completedTasks: data.completedTasks, status: data.goalStatus }
            : g
        )
      );
      if (completed) toast.success("Task complete — +10 XP");
    } catch (err) {
      setSelectedDetail({ ...selectedDetail, weeks: previousWeeks });
      toast.error("Couldn't update task", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setPendingTaskId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <GoalListPanel
        goals={goals}
        selectedGoalId={selectedGoalId}
        onSelectGoal={handleSelectGoal}
        onAddGoal={() => setIsModalOpen(true)}
      />

      {selectedDetail ? (
        <RoadmapView
          goal={selectedDetail.goal}
          weeks={selectedDetail.weeks}
          isLoading={isLoadingDetail}
          isGenerating={isGenerating}
          pendingTaskId={pendingTaskId}
          onGenerate={handleGenerate}
          onToggleTask={handleToggleTask}
        />
      ) : (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          {isLoadingDetail ? "Loading..." : "Select a goal, or set a new one, to see its roadmap here."}
        </div>
      )}

      <AddGoalModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        isSubmitting={isCreating}
        onSubmit={handleAddGoal}
      />
    </div>
  );
}
