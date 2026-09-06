"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RoadmapWeek } from "@/lib/validations/roadmap";

type WeekStatus = "upcoming" | "in_progress" | "completed";

function weekStatus(week: RoadmapWeek): WeekStatus {
  if (week.tasks.every((t) => t.status === "completed")) return "completed";
  if (week.tasks.some((t) => t.status === "completed")) return "in_progress";
  return "upcoming";
}

const STATUS_LABEL: Record<WeekStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_BADGE_CLASS: Record<WeekStatus, string> = {
  upcoming: "bg-accent text-muted-foreground",
  in_progress: "bg-secondary/15 text-secondary",
  completed: "bg-success/15 text-success",
};

interface RoadmapWeekCardProps {
  week: RoadmapWeek;
  isCurrent: boolean;
  pendingTaskId: string | null;
  onToggleTask: (taskId: string, completed: boolean) => void;
}

export function RoadmapWeekCard({ week, isCurrent, pendingTaskId, onToggleTask }: RoadmapWeekCardProps) {
  const status = weekStatus(week);
  // Completed weeks collapse automatically; the current week always
  // starts open. Still toggleable by hand either way.
  const [isOpen, setIsOpen] = React.useState(status !== "completed");

  React.useEffect(() => {
    if (status === "completed") setIsOpen(false);
  }, [status]);

  const completedCount = week.tasks.filter((t) => t.status === "completed").length;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors duration-fast",
        isCurrent ? "border-secondary" : "border-border"
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              isCurrent ? "bg-gradient-primary text-primary-foreground" : "bg-accent text-muted-foreground"
            )}
          >
            {week.weekNumber}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{week.focusArea}</p>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{week.tasks.length} tasks
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_BADGE_CLASS[status])}>
            {STATUS_LABEL[status]}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 border-t border-border px-4 py-3">
              {week.tasks.map((task) => {
                const isDone = task.status === "completed";
                const isPending = pendingTaskId === task.id;
                return (
                  <li key={task.id} className="flex items-start gap-2.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onToggleTask(task.id, !isDone)}
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-fast",
                        isDone
                          ? "border-transparent bg-gradient-primary text-primary-foreground"
                          : "border-border-strong bg-background",
                        isPending && "opacity-50"
                      )}
                    >
                      {isDone && <Check className="h-3 w-3" />}
                    </button>
                    <span
                      className={cn(
                        "text-sm",
                        isDone ? "text-muted-foreground line-through" : "text-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
