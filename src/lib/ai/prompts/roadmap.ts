import type { OpenRouterMessage } from "@/lib/ai/openrouter";
import type { GoalType } from "@/lib/validations/roadmap";
import { GOAL_TYPE_LABELS } from "@/lib/validations/roadmap";

export interface RoadmapCandidateContext {
  fullName: string;
  currentJobRole: string;
  yearsExperience: number;
  skills: string[];
  targetRoles: string[];
  education: string[];
}

const GOAL_TYPE_GUIDANCE: Record<GoalType, string> = {
  job: "Focus weekly tasks on: resume/portfolio readiness, targeted skill gaps for the roles they want, applying to real jobs, networking, and interview preparation.",
  skill: "Focus weekly tasks on: structured learning (specific topics/resources to study), hands-on practice exercises, and a small project or two that applies the skill.",
  project: "Focus weekly tasks on: scoping the project, breaking it into buildable milestones, actually building each part, and finishing with documentation/deployment/showcasing it.",
  promotion: "Focus weekly tasks on: identifying the gap between their current scope and the target level, taking on visible higher-impact work, documenting achievements, and having the right conversations with their manager.",
  career_switch: "Focus weekly tasks on: identifying transferable skills, closing the specific gap to the new field, building proof of work relevant to it, and starting to network/apply in the new direction.",
};

function contextBlock(ctx: RoadmapCandidateContext): string {
  return `CANDIDATE PROFILE:
- Name: ${ctx.fullName || "Not provided"}
- Current role: ${ctx.currentJobRole || "Not provided"}
- Years of experience: ${ctx.yearsExperience}
- Skills on file: ${ctx.skills.length > 0 ? ctx.skills.join(", ") : "None listed"}
- Target roles: ${ctx.targetRoles.length > 0 ? ctx.targetRoles.join(", ") : "None listed"}
- Education: ${ctx.education.length > 0 ? ctx.education.join("; ") : "None listed"}`;
}

export function buildRoadmapGenerationMessages(
  ctx: RoadmapCandidateContext,
  goal: { title: string; description: string; type: GoalType; targetDate: string | null },
  weekCount: number
): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: `You are a career coach for CareerPilot AI, building a concrete week-by-week action plan for a candidate's real goal. This is a "${GOAL_TYPE_LABELS[goal.type]}" goal. ${GOAL_TYPE_GUIDANCE[goal.type]}

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{
  "weeks": [
    { "weekNumber": number, "focusArea": string (short theme for the week, e.g. "Foundations" or "Apply to 10 roles"), "tasks": string[] (3-6 specific, concrete, actionable tasks) }
  ]
}

Rules:
- Exactly ${weekCount} weeks, numbered 1 to ${weekCount}, building progressively toward the goal.
- Ground every task in the candidate's real profile below — reference their actual skills, gaps, and target roles rather than generic advice.
- Tasks must be concrete and completable within that week (e.g. "Complete 2 LeetCode medium problems on graph traversal", not "Get better at algorithms").
- Never invent skills or achievements the candidate doesn't have — build toward the goal from where they actually are.`,
    },
    {
      role: "user",
      content: `GOAL: ${goal.title}
GOAL DESCRIPTION: ${goal.description || "Not provided"}
TARGET DATE: ${goal.targetDate ?? "Not specified"}

${contextBlock(ctx)}`,
    },
  ];
}
