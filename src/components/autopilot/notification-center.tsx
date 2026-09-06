"use client";

import { Bell } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ApprovalCard } from "./approval-card";
import type { AutopilotApprovalRow } from "@/lib/validations/autopilot";

interface NotificationCenterProps {
  pending: AutopilotApprovalRow[];
  sent: AutopilotApprovalRow[];
  rejected: AutopilotApprovalRow[];
  busyIds: Set<string>;
  onApprove: (id: string, edits?: { subject: string; body: string; to: string }) => void;
  onReject: (id: string) => void;
}

export function NotificationCenter({ pending, sent, rejected, busyIds, onApprove, onReject }: NotificationCenterProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-heading text-sm font-semibold text-foreground">Notification Center</h2>
        {pending.length > 0 && (
          <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <EmptyState icon={Bell} title="No pending approvals" description="Run Autopilot to generate drafts for review." className="py-10" />
      ) : (
        <div className="space-y-3">
          {pending.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} busy={busyIds.has(approval.id)} onApprove={onApprove} onReject={onReject} />
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sent</h3>
          <div className="space-y-2">
            {sent.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} busy={false} onApprove={onApprove} onReject={onReject} />
            ))}
          </div>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skipped</h3>
          <div className="space-y-2">
            {rejected.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} busy={false} onApprove={onApprove} onReject={onReject} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
