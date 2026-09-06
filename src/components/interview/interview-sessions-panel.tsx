"use client";

import { History } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatDate } from "@/lib/utils";

export interface InterviewSessionSummary {
  id: string;
  job_title: string | null;
  company: string | null;
  status: string;
  overall_score: number | null;
  created_at: string;
}

interface InterviewSessionsPanelProps {
  sessions: InterviewSessionSummary[];
  onSelect: (sessionId: string) => void;
  onNew: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_CLASS: Record<string, string> = {
  scheduled: "bg-warning/15 text-warning",
  in_progress: "bg-secondary/15 text-secondary",
  completed: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
};

/**
 * Every interview session the user has, not just ones reached from the
 * setup form — without this, a session Autopilot auto-creates on
 * approval (see api/autopilot/approve) was only ever reachable via its
 * one-time notification link, with nothing on this page itself to find
 * it again afterward.
 */
export function InterviewSessionsPanel({ sessions, onSelect, onNew }: InterviewSessionsPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading text-sm font-semibold text-foreground">Your Sessions</h2>
        </div>
        <button type="button" onClick={onNew} className="text-xs text-primary hover:underline">
          + New
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={History} title="No interviews yet" description="Start one below, or approve a job application in Autopilot." className="py-10" />
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelect(session.id)}
              className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors duration-fast hover:border-border-strong"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_CLASS[session.status] ?? "bg-accent text-muted-foreground")}>
                  {STATUS_LABEL[session.status] ?? session.status}
                </span>
                {session.overall_score !== null && (
                  <span className="text-xs font-semibold text-foreground">{session.overall_score}/100</span>
                )}
              </div>
              <p className="mt-1.5 truncate text-sm font-medium text-foreground">{session.job_title ?? "Untitled role"}</p>
              {session.company && <p className="truncate text-xs text-muted-foreground">{session.company}</p>}
              <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(session.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
