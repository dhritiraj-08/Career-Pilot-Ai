import { Activity } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, cn } from "@/lib/utils";
import { displayAgentName } from "@/lib/agent-metadata";

export interface AgentActivityRow {
  id: string;
  agent_name: string;
  action: string;
  status: string;
  created_at: string;
}

const STATUS_DOT: Record<string, string> = {
  running: "bg-secondary",
  success: "bg-success",
  failed: "bg-destructive",
};

export function RecentActivityCard({ activities }: { activities: AgentActivityRow[] }) {
  return (
    <div className="card-hover rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold text-foreground">Recent activity</h3>

      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Once your AI agents start running, their actions will show up here."
          className="mt-4 py-10"
        />
      ) : (
        <ul className="mt-4 space-y-3.5">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-start gap-3 text-sm">
              <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[activity.status] ?? "bg-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">{activity.action}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {displayAgentName(activity.agent_name)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{formatDate(activity.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
