import { z } from "zod";

// Not a DB column — career_goals has no goal_type field, and nothing in
// the UI ever displays it back (only the create modal collects it).
// It exists purely to steer the AI prompt toward the right shape of
// weekly tasks (job-search tasks vs. skill-building vs. project
// milestones), so it's passed through the request body and never
// persisted rather than adding a column with no read path.
export const GOAL_TYPES = ["job", "skill", "project", "promotion", "career_switch"] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  job: "Get a job",
  skill: "Learn a skill",
  project: "Build a project",
  promotion: "Get a promotion",
  career_switch: "Switch career",
};

export interface RoadmapTask {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "completed" | "skipped";
  dueDate: string | null;
  completedAt: string | null;
  orderIndex: number;
}

export interface RoadmapWeek {
  weekNumber: number;
  focusArea: string;
  tasks: RoadmapTask[];
}

export interface GoalSummary {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: "not_started" | "in_progress" | "completed" | "abandoned";
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
}

// ---------------------------------------------------------------------
// LLM roadmap-generation response
// ---------------------------------------------------------------------
const rawTaskSchema = z.union([
  z.string(),
  z.object({ title: z.string() }).transform((v) => v.title),
]);

const rawWeekSchema = z.object({
  weekNumber: z.number().nullable().optional(),
  focusArea: z.string().nullable().optional(),
  tasks: z.array(rawTaskSchema).nullable().optional(),
});

const rawRoadmapSchema = z.object({
  weeks: z.array(rawWeekSchema).nullable().optional(),
});

export interface GeneratedWeek {
  weekNumber: number;
  focusArea: string;
  tasks: string[];
}

/** Lenient parse of the LLM's roadmap JSON — malformed/missing fields
 * are defaulted or dropped rather than discarding the whole response,
 * same approach as the other agents' validations. Re-numbers weeks
 * sequentially from 1 regardless of what the model returned, so a
 * gap or duplicate weekNumber can't produce a broken timeline. */
export function parseGeneratedRoadmap(raw: unknown, expectedWeeks: number): GeneratedWeek[] {
  const parsed = rawRoadmapSchema.safeParse(raw);
  const weeks = parsed.success ? parsed.data.weeks ?? [] : [];

  return weeks
    .filter((w) => (w.tasks ?? []).length > 0)
    .slice(0, expectedWeeks)
    .map((w, i) => ({
      weekNumber: i + 1,
      focusArea: w.focusArea?.trim() || `Week ${i + 1}`,
      tasks: (w.tasks ?? []).map((t) => t.trim()).filter(Boolean),
    }));
}
