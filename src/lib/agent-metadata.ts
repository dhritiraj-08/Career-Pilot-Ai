import type { LucideIcon } from "lucide-react";
import { Sparkles, Radar as RadarIcon, Brain, Mail, Compass, Zap } from "lucide-react";

/**
 * Single source of truth for the agent rebrand — display name, tagline,
 * and icon only. Nothing here touches route paths, database values
 * (agent_activities.agent_name, etc.), or any request/response shape —
 * this is a purely presentational lookup so "Resume Architect" reads as
 * "Nexus" everywhere in the UI without renaming anything the backend
 * actually depends on.
 */
export type AgentId = "resume-architect" | "job-hunter" | "interview" | "email" | "roadmap" | "autopilot";

export interface AgentMeta {
  id: AgentId;
  name: string;
  legacyName: string;
  tagline: string;
  icon: LucideIcon;
  href: string;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  "resume-architect": {
    id: "resume-architect",
    name: "Nexus",
    legacyName: "Resume Architect",
    tagline: "AI Resume Intelligence",
    icon: Sparkles,
    href: "/dashboard/resume-architect",
  },
  "job-hunter": {
    id: "job-hunter",
    name: "Radar",
    legacyName: "Job Hunter",
    tagline: "Opportunity Scanner",
    icon: RadarIcon,
    href: "/dashboard/jobs",
  },
  interview: {
    id: "interview",
    name: "Mentor",
    legacyName: "Interview Agent",
    tagline: "Interview Coach AI",
    icon: Brain,
    href: "/dashboard/interview",
  },
  email: {
    id: "email",
    name: "Hermes",
    legacyName: "Email Agent",
    tagline: "Communication Agent",
    icon: Mail,
    href: "/dashboard/email",
  },
  roadmap: {
    id: "roadmap",
    name: "Atlas",
    legacyName: "Career Roadmap",
    tagline: "Career Navigator",
    icon: Compass,
    href: "/dashboard/roadmap",
  },
  autopilot: {
    id: "autopilot",
    name: "Aria",
    legacyName: "Autopilot",
    tagline: "Career Autopilot",
    icon: Zap,
    href: "/dashboard/autopilot",
  },
};

export const AGENT_LIST: AgentMeta[] = Object.values(AGENTS);

/** Maps agent_activities.agent_name (a stored DB value — never
 * changed) to a display name, purely for rendering the Activity Feed /
 * Recent Activity list. "orchestrator" is used by both Autopilot's own
 * logging and Roadmap's goal-generation step (the schema has no
 * separate value for the latter) — shown as Aria either way, since
 * that's the more common case and there's no way to distinguish them
 * without a backend change this revamp isn't making. */
export const AGENT_NAME_BY_DB_VALUE: Record<string, string> = {
  resume_architect: AGENTS["resume-architect"].name,
  job_hunter: AGENTS["job-hunter"].name,
  interview_agent: AGENTS.interview.name,
  email_agent: AGENTS.email.name,
  orchestrator: AGENTS.autopilot.name,
};

export function displayAgentName(dbValue: string): string {
  return AGENT_NAME_BY_DB_VALUE[dbValue] ?? dbValue;
}
