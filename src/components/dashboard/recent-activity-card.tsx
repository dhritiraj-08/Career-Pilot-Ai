import { Activity } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";

export interface AgentActivityRow {
  id: string;
  agent_name: string;
  action: string;
  status: string;
  created_at: string;
}

const AGENT_LABEL: Record<string, string> = {
  resume_architect: "Resume Architect",
  job_hunter: "Job Hunter",
  email_agent: "Email Agent",
  interview_agent: "Interview Agent",
  orchestrator: "Orchestrator",
};

export function RecentActivityCard({ activities }: { activities: AgentActivityRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold text-foreground">Recent activity</h3>

      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Once your AI agents start running, their actions will show up here."
          className="mt-4 py-10"
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground">
                  {AGENT_LABEL[activity.agent_name] ?? activity.agent_name}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(activity.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
