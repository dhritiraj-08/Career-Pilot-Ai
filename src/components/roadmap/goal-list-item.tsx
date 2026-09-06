"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { GoalSummary } from "@/lib/validations/roadmap";

const STATUS_BADGE: Record<GoalSummary["status"], { label: string; className: string }> = {
  not_started: { label: "Active", className: "bg-accent text-foreground" },
  in_progress: { label: "Active", className: "bg-secondary/15 text-secondary" },
  completed: { label: "Completed", className: "bg-success/15 text-success" },
  abandoned: { label: "Paused", className: "bg-warning/15 text-warning" },
};

interface GoalListItemProps {
  goal: GoalSummary;
  isSelected: boolean;
  onClick: () => void;
}

export function GoalListItem({ goal, isSelected, onClick }: GoalListItemProps) {
  const badge = STATUS_BADGE[goal.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-colors duration-fast",
        isSelected
          ? "border-secondary bg-secondary/10"
          : "border-border bg-card hover:border-border-strong"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-heading text-sm font-semibold text-foreground">{goal.title}</p>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
          {badge.label}
        </span>
      </div>
      {goal.targetDate && (
        <p className="mt-1 text-xs text-muted-foreground">Target: {formatDate(goal.targetDate)}</p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-gradient-primary transition-all duration-500"
            style={{ width: `${goal.progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{goal.progressPercent}%</span>
      </div>
    </button>
  );
}
