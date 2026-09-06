"use client";

import { Activity } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export interface ActivityEntry {
  id: string;
  action: string;
  status: "running" | "success" | "failed";
  created_at: string;
  details?: { run_id?: string; job_listing_id?: string } | null;
}

interface ActivityFeedProps {
  activity: ActivityEntry[];
}

// agent_activities only tracks running/success/failed (see
// docs/schema.sql) — the spec's fourth color, yellow="waiting", isn't a
// distinct DB status. It's derived here from the entry's own action
// text ("awaiting your approval") rather than invented as a new column.
function colorFor(entry: ActivityEntry): { dot: string; text: string } {
  if (entry.action.toLowerCase().includes("awaiting your approval")) {
    return { dot: "bg-warning", text: "text-warning" };
  }
  if (entry.status === "running") return { dot: "bg-secondary", text: "text-secondary" };
  if (entry.status === "failed") return { dot: "bg-destructive", text: "text-destructive" };
  return { dot: "bg-success", text: "text-success" };
}

export function ActivityFeed({ activity }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-heading text-sm font-semibold text-foreground">Activity Feed</h2>
      </div>

      {activity.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" description="Runs and approvals will show up here as they happen." className="py-10" />
      ) : (
        <ol className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
          {activity.map((entry) => {
            const color = colorFor(entry);
            return (
              <li key={entry.id} className="flex items-start gap-3 text-xs">
                <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", color.dot)} />
                <span className="w-16 shrink-0 text-[10px] text-muted-foreground">
                  {new Date(entry.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">orchestrator</span>
                <span className={cn("flex-1", color.text)}>{entry.action}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
