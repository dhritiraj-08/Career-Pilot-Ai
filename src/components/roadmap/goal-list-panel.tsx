"use client";

import { Target, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import type { GoalSummary } from "@/lib/validations/roadmap";
import { GoalListItem } from "./goal-list-item";

interface GoalListPanelProps {
  goals: GoalSummary[];
  selectedGoalId: string | null;
  onSelectGoal: (goalId: string) => void;
  onAddGoal: () => void;
}

export function GoalListPanel({ goals, selectedGoalId, onSelectGoal, onAddGoal }: GoalListPanelProps) {
  return (
    <div className="space-y-4">
      <Button type="button" className="w-full" size="lg" onClick={onAddGoal}>
        <Plus className="mr-2 h-4 w-4" />
        Set a New Goal
      </Button>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set your first career goal and we'll build a week-by-week plan to get you there."
          className="py-12"
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalListItem
              key={goal.id}
              goal={goal}
              isSelected={goal.id === selectedGoalId}
              onClick={() => onSelectGoal(goal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
