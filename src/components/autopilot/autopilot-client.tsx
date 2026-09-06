"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AutopilotApprovalRow, AutopilotRunRow, AutopilotSettingsRow } from "@/lib/validations/autopilot";
import { ControlPanel } from "./control-panel";
import { ParametersPanel } from "./parameters-panel";
import { NotificationCenter } from "./notification-center";
import { ActivityFeed, type ActivityEntry } from "./activity-feed";

const STATUS_POLL_INTERVAL_MS = 3000;
const APPROVALS_POLL_INTERVAL_MS = 5000;

interface AutopilotClientProps {
  initialRun: AutopilotRunRow | null;
  todaySummary: { jobsFound: number; draftsCreated: number; applicationsSent: number };
  settings: AutopilotSettingsRow;
  targetRoles: string[];
  workMode: string | null;
  hasResume: boolean;
  gmailConnected: boolean;
  initialPending: AutopilotApprovalRow[];
  initialSent: AutopilotApprovalRow[];
  initialRejected: AutopilotApprovalRow[];
  initialActivity: ActivityEntry[];
}

export function AutopilotClient({
  initialRun,
  todaySummary,
  settings: initialSettings,
  targetRoles,
  workMode,
  hasResume,
  gmailConnected,
  initialPending,
  initialSent,
  initialRejected,
  initialActivity,
}: AutopilotClientProps) {
  const router = useRouter();
  const [run, setRun] = React.useState(initialRun);
  const [settings, setSettings] = React.useState(initialSettings);
  const [pending, setPending] = React.useState(initialPending);
  const [sent, setSent] = React.useState(initialSent);
  const [rejected, setRejected] = React.useState(initialRejected);
  const [activity, setActivity] = React.useState(initialActivity);
  const [isStarting, setIsStarting] = React.useState(false);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);
  const [busyIds, setBusyIds] = React.useState<Set<string>>(new Set());

  const refreshApprovals = React.useCallback(async () => {
    try {
      const res = await fetch("/api/autopilot/approvals");
      const data = await res.json();
      if (res.ok) setPending(data.approvals ?? []);
    } catch {
      // transient — next poll or manual refresh will pick it up
    }
  }, []);

  // Poll run status while a run is in progress — this is a multi-minute
  // background pipeline (see api/autopilot/run's doc comment), so the
  // page can't just wait on the original request.
  React.useEffect(() => {
    if (!run || run.status !== "running") return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/autopilot/status/${run.id}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setRun(data.run);
        setActivity(data.activity ?? []);
        if (data.run.status !== "running") {
          await refreshApprovals();
          router.refresh();
          if (data.run.status === "completed") {
            toast.success("Autopilot run finished", {
              description: `${data.run.drafts_created} draft${data.run.drafts_created === 1 ? "" : "s"} ready for review.`,
            });
          } else if (data.run.status === "failed") {
            toast.error("Autopilot run failed", { description: data.run.error_message ?? "Check the activity feed for details." });
          }
        }
      } catch {
        // transient network error — next tick retries
      }
    };

    poll();
    const interval = setInterval(poll, STATUS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id, run?.status]);

  // Separate from the status/activity poll above: the run route drafts
  // approvals one job at a time, often minutes apart for a run with
  // several matches (see the real timestamps in autopilot_approvals —
  // roughly a minute apart per job, since each one is its own resume
  // tailoring + compose pass). Without this, the Activity Feed would
  // show "Draft ready..." live while the Notification Center kept
  // showing whatever was pending when the page loaded, only catching up
  // once the entire run finished. Polls independently of the status
  // loop so a new draft appears (and starts pulsing) within 5s of being
  // created, not only at the end of a run that can take several minutes.
  React.useEffect(() => {
    if (run?.status !== "running") return;
    let cancelled = false;

    refreshApprovals();
    const interval = setInterval(() => {
      if (!cancelled) refreshApprovals();
    }, APPROVALS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [run?.status, refreshApprovals]);

  const handleRun = async () => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/autopilot/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setRun({
        id: data.runId,
        status: "running",
        started_at: new Date().toISOString(),
        completed_at: null,
        jobs_found: 0,
        drafts_created: 0,
        applications_sent: 0,
        error_message: null,
      });
      toast.success("Autopilot started");
    } catch (err) {
      toast.error("Couldn't start Autopilot", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setIsStarting(false);
    }
  };

  const handleSaveSettings = async (next: AutopilotSettingsRow) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/autopilot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minMatchScore: next.min_match_score,
          maxApplicationsPerDay: next.max_applications_per_day,
          autoSchedule: next.auto_schedule,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSettings(data);
      toast.success("Parameters saved");
    } catch (err) {
      toast.error("Couldn't save parameters", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      await fn();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleApprove = (id: string, edits?: { subject: string; body: string; to: string }) =>
    withBusy(id, async () => {
      try {
        const res = await fetch(`/api/autopilot/approve/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(edits ?? {}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");

        setPending((prev) => {
          const item = prev.find((a) => a.id === id);
          if (item) {
            setSent((s) => [
              {
                ...item,
                status: "sent",
                ...(edits ? { email_draft_subject: edits.subject, email_draft_body: edits.body, email_to: edits.to } : {}),
                ...(data.interviewSessionId
                  ? { context: { ...(item.context ?? {}), interviewSessionId: data.interviewSessionId } }
                  : {}),
              },
              ...s,
            ]);
          }
          return prev.filter((a) => a.id !== id);
        });
        toast.success(data.interviewSessionId ? "Sent — interview prep is ready too" : "Sent");
        router.refresh();
      } catch (err) {
        toast.error("Couldn't send", { description: err instanceof Error ? err.message : "Please try again." });
      }
    });

  const handleReject = (id: string) =>
    withBusy(id, async () => {
      try {
        const res = await fetch(`/api/autopilot/reject/${id}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");

        setPending((prev) => {
          const item = prev.find((a) => a.id === id);
          if (item) setRejected((r) => [{ ...item, status: "rejected" }, ...r]);
          return prev.filter((a) => a.id !== id);
        });
        toast.success("Skipped");
        router.refresh();
      } catch (err) {
        toast.error("Couldn't skip", { description: err instanceof Error ? err.message : "Please try again." });
      }
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <ControlPanel
            run={run}
            pendingCount={pending.length}
            todaySummary={todaySummary}
            isStarting={isStarting}
            onRun={handleRun}
            hasResume={hasResume}
            gmailConnected={gmailConnected}
          />
          <ParametersPanel
            settings={settings}
            targetRoles={targetRoles}
            workMode={workMode}
            isSaving={isSavingSettings}
            onSave={handleSaveSettings}
          />
        </div>
        <NotificationCenter
          pending={pending}
          sent={sent}
          rejected={rejected}
          busyIds={busyIds}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>

      <ActivityFeed activity={activity} />
    </div>
  );
}
