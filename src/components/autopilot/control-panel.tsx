"use client";

import type * as React from "react";
import { Loader2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { AutopilotRunRow } from "@/lib/validations/autopilot";

interface ControlPanelProps {
  run: AutopilotRunRow | null;
  pendingCount: number;
  todaySummary: { jobsFound: number; draftsCreated: number; applicationsSent: number };
  isStarting: boolean;
  onRun: () => void;
  hasResume: boolean;
  gmailConnected: boolean;
}

type DisplayStatus = "idle" | "running" | "waiting_approval" | "failed";

const STATUS_META: Record<DisplayStatus, { label: string; dot: string; text: string }> = {
  idle: { label: "Idle", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  running: { label: "Running", dot: "bg-primary", text: "text-primary" },
  waiting_approval: { label: "Waiting for Approval", dot: "bg-warning", text: "text-warning" },
  failed: { label: "Failed", dot: "bg-destructive", text: "text-destructive" },
};

export function ControlPanel({ run, pendingCount, todaySummary, isStarting, onRun, hasResume, gmailConnected }: ControlPanelProps) {
  const displayStatus: DisplayStatus =
    run?.status === "running"
      ? "running"
      : run?.status === "failed"
        ? "failed"
        : pendingCount > 0
          ? "waiting_approval"
          : "idle";

  const meta = STATUS_META[displayStatus];
  const isRunning = run?.status === "running";
  const disabled = isStarting || isRunning || !hasResume;

  return (
    <div className="rounded-xl border border-border bg-gradient-surface p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                meta.dot,
                (displayStatus === "running" || displayStatus === "waiting_approval") && "animate-pulse-glow"
              )}
              style={
                displayStatus === "waiting_approval"
                  ? ({ "--pulse-glow-color": "var(--warning)" } as React.CSSProperties)
                  : displayStatus === "running"
                    ? ({ "--pulse-glow-color": "var(--primary)" } as React.CSSProperties)
                    : undefined
              }
            />
            <span className={cn("text-sm font-semibold", meta.text)}>{meta.label}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Last run: {run ? formatDate(run.started_at) : "Never"}
          </p>
          {run?.status === "failed" && run.error_message && (
            <p className="mt-1 max-w-sm text-xs text-destructive">{run.error_message}</p>
          )}
        </div>

        <Button
          type="button"
          size="lg"
          onClick={onRun}
          disabled={disabled}
          className="shrink-0 shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
        >
          {isStarting || isRunning ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Zap className="mr-2 h-5 w-5" />
          )}
          {isRunning ? "Running..." : "Run Career Autopilot"}
        </Button>
      </div>

      {!hasResume && (
        <p className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Add a resume to your vault before running Autopilot.
        </p>
      )}
      {hasResume && !gmailConnected && (
        <p className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Connect Gmail on the Email Agent page before approving drafts — Autopilot can still find jobs and write drafts without it, but can&apos;t send until it&apos;s connected.
        </p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <SummaryTile label="Jobs found today" value={todaySummary.jobsFound} />
        <SummaryTile label="Drafts ready" value={pendingCount} />
        <SummaryTile label="Sent today" value={todaySummary.applicationsSent} />
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
      <p className="font-heading text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
