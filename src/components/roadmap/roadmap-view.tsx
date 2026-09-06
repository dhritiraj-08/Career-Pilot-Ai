"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { CompletionRing } from "@/components/shared/completion-ring";
import { formatDate } from "@/lib/utils";
import type { RoadmapWeek } from "@/lib/validations/roadmap";
import { RoadmapWeekCard } from "./roadmap-week-card";

interface RoadmapGoal {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
}

interface RoadmapViewProps {
  goal: RoadmapGoal;
  weeks: RoadmapWeek[];
  isLoading: boolean;
  isGenerating: boolean;
  pendingTaskId: string | null;
  onGenerate: () => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
}

function daysRemaining(targetDate: string | null): number | null {
  if (!targetDate) return null;
  const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days;
}

export function RoadmapView({ goal, weeks, isLoading, isGenerating, pendingTaskId, onGenerate, onToggleTask }: RoadmapViewProps) {
  const totalTasks = weeks.reduce((sum, w) => sum + w.tasks.length, 0);
  const completedTasks = weeks.reduce((sum, w) => sum + w.tasks.filter((t) => t.status === "completed").length, 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const remaining = daysRemaining(goal.targetDate);

  // The current week is the first one not fully completed — everything
  // before it is done, everything after is still ahead.
  const currentWeekNumber = weeks.find((w) => w.tasks.some((t) => t.status !== "completed"))?.weekNumber;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-semibold text-foreground">{goal.title}</h2>
            {goal.description && <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {goal.targetDate && <span>Target: {formatDate(goal.targetDate)}</span>}
              {remaining != null && (
                <span className={remaining < 0 ? "text-destructive" : undefined}>
                  {remaining < 0 ? `${Math.abs(remaining)} days overdue` : `${remaining} days remaining`}
                </span>
              )}
            </div>
          </div>
          {totalTasks > 0 && (
            <div className="shrink-0">
              <CompletionRing percent={progressPercent} size={72} />
            </div>
          )}
        </div>

        {weeks.length === 0 && !isLoading && (
          <Button type="button" className="mt-4 w-full sm:w-auto" onClick={onGenerate} disabled={isGenerating}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating roadmap..." : "AI Generate Roadmap"}
          </Button>
        )}
        {weeks.length > 0 && (
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onGenerate} disabled={isGenerating}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {isGenerating ? "Regenerating..." : "Regenerate Roadmap"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          Loading roadmap...
        </div>
      ) : weeks.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No roadmap yet"
          description='Click "AI Generate Roadmap" above to build a week-by-week plan for this goal.'
          className="py-16"
        />
      ) : (
        <div className="space-y-3">
          {weeks.map((week) => (
            <RoadmapWeekCard
              key={week.weekNumber}
              week={week}
              isCurrent={week.weekNumber === currentWeekNumber}
              pendingTaskId={pendingTaskId}
              onToggleTask={onToggleTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
