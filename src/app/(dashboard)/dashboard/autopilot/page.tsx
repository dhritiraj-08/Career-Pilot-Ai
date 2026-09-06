import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { clampSettings } from "@/lib/validations/autopilot";
import type { AutopilotApprovalRow, AutopilotRunRow } from "@/lib/validations/autopilot";
import { AutopilotClient } from "@/components/autopilot/autopilot-client";

const RECENT_LIMIT = 20;
const ACTIVITY_LIMIT = 40;

export default async function AutopilotPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { data: settingsRow },
    { data: preferences },
    { count: resumeCount },
    { data: gmailToken },
    { data: latestRun },
    { data: todaysRuns },
    { data: pendingApprovals },
    { data: sentApprovals },
    { data: rejectedApprovals },
    { data: activity },
  ] = await Promise.all([
    supabase.from("autopilot_settings").select("min_match_score, max_applications_per_day, auto_schedule").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_preferences").select("target_roles, work_mode").eq("user_id", user.id).maybeSingle(),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("oauth_tokens").select("email").eq("user_id", user.id).eq("provider", "gmail").maybeSingle(),
    supabase.from("autopilot_runs").select("*").eq("user_id", user.id).order("started_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("autopilot_runs").select("jobs_found, drafts_created, applications_sent").eq("user_id", user.id).gte("started_at", todayStart.toISOString()),
    supabase.from("autopilot_approvals").select("*").eq("user_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("autopilot_approvals").select("*").eq("user_id", user.id).eq("status", "sent").order("updated_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("autopilot_approvals").select("*").eq("user_id", user.id).eq("status", "rejected").order("updated_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("agent_activities").select("id, action, status, created_at, details").eq("user_id", user.id).eq("agent_name", "orchestrator").order("created_at", { ascending: false }).limit(ACTIVITY_LIMIT),
  ]);

  const settings = clampSettings({
    minMatchScore: settingsRow?.min_match_score,
    maxApplicationsPerDay: settingsRow?.max_applications_per_day,
    autoSchedule: settingsRow?.auto_schedule,
  });

  const todaySummary = (todaysRuns ?? []).reduce(
    (acc, r) => ({
      jobsFound: acc.jobsFound + (r.jobs_found ?? 0),
      draftsCreated: acc.draftsCreated + (r.drafts_created ?? 0),
      applicationsSent: acc.applicationsSent + (r.applications_sent ?? 0),
    }),
    { jobsFound: 0, draftsCreated: 0, applicationsSent: 0 }
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Career Autopilot</h1>
      <AutopilotClient
        initialRun={(latestRun as AutopilotRunRow | null) ?? null}
        todaySummary={todaySummary}
        settings={settings}
        targetRoles={preferences?.target_roles ?? []}
        workMode={preferences?.work_mode ?? null}
        hasResume={(resumeCount ?? 0) > 0}
        gmailConnected={Boolean(gmailToken?.email)}
        initialPending={(pendingApprovals as AutopilotApprovalRow[] | null) ?? []}
        initialSent={(sentApprovals as AutopilotApprovalRow[] | null) ?? []}
        initialRejected={(rejectedApprovals as AutopilotApprovalRow[] | null) ?? []}
        initialActivity={activity ?? []}
      />
    </div>
  );
}
