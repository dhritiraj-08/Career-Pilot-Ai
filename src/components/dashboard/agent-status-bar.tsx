import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FileText, Map, Mic, Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface AgentCardDef {
  name: string;
  description: string;
  icon: LucideIcon;
  status: "ready" | "coming-soon";
  href?: string;
}

// Job Hunter / Interview Coach / Career Roadmap have no real pages yet.
// Flip an entry's status to "ready" (and give it an href) as each one
// actually ships.
const AGENTS: AgentCardDef[] = [
  {
    name: "Resume Architect",
    description: "AI-tailored resumes and cover letters, scored against the job.",
    icon: FileText,
    status: "ready",
    href: "/dashboard/resume-architect",
  },
  {
    name: "Job Hunter",
    description: "Finds and matches jobs to your profile automatically.",
    icon: Search,
    status: "coming-soon",
  },
  {
    name: "Interview Coach",
    description: "Voice-based mock interviews with real feedback.",
    icon: Mic,
    status: "coming-soon",
  },
  {
    name: "Career Roadmap",
    description: "A personalized plan to reach your career goals.",
    icon: Map,
    status: "coming-soon",
  },
];

export function AgentStatusBar() {
  return (
    <div>
      <h3 className="mb-4 font-heading text-base font-semibold text-foreground">Your AI agents</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AGENTS.map((agent) => {
          const card = (
            <div
              className={cn(
                "h-full rounded-lg border border-border bg-card p-5 transition-colors duration-fast",
                agent.status === "ready" && "hover:border-primary hover:bg-accent"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <agent.icon className="h-5 w-5 text-secondary" />
                </div>
                <span
                  className={
                    agent.status === "ready"
                      ? "rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success"
                      : "rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  }
                >
                  {agent.status === "ready" ? "Ready" : "Coming soon"}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{agent.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{agent.description}</p>
            </div>
          );

          return agent.status === "ready" && agent.href ? (
            <Link key={agent.name} href={agent.href}>
              {card}
            </Link>
          ) : (
            <div key={agent.name}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
