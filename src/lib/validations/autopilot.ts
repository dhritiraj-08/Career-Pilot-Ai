export const AUTOPILOT_RUN_STATUSES = ["running", "completed", "failed", "paused"] as const;
export type AutopilotRunStatus = (typeof AUTOPILOT_RUN_STATUSES)[number];

export const APPROVAL_TYPES = ["job_application", "interview_reply", "followup"] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  job_application: "Job Application",
  interview_reply: "Interview Reply",
  followup: "Follow-up",
};

export const APPROVAL_STATUSES = ["pending", "approved", "rejected", "sent"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const AUTO_SCHEDULES = ["manual", "daily", "weekly"] as const;
export type AutoSchedule = (typeof AUTO_SCHEDULES)[number];

export const MIN_MATCH_SCORE_BOUNDS = { min: 50, max: 95, default: 70 } as const;
export const MAX_APPLICATIONS_BOUNDS = { min: 1, max: 10, default: 5 } as const;

export interface AutopilotSettingsRow {
  min_match_score: number;
  max_applications_per_day: number;
  auto_schedule: AutoSchedule;
}

export function clampSettings(input: {
  minMatchScore?: number;
  maxApplicationsPerDay?: number;
  autoSchedule?: string;
}): AutopilotSettingsRow {
  const minMatchScore = Math.min(
    MIN_MATCH_SCORE_BOUNDS.max,
    Math.max(MIN_MATCH_SCORE_BOUNDS.min, Math.round(input.minMatchScore ?? MIN_MATCH_SCORE_BOUNDS.default))
  );
  const maxApplicationsPerDay = Math.min(
    MAX_APPLICATIONS_BOUNDS.max,
    Math.max(MAX_APPLICATIONS_BOUNDS.min, Math.round(input.maxApplicationsPerDay ?? MAX_APPLICATIONS_BOUNDS.default))
  );
  const autoSchedule = (AUTO_SCHEDULES as readonly string[]).includes(input.autoSchedule ?? "")
    ? (input.autoSchedule as AutoSchedule)
    : "manual";
  return { min_match_score: minMatchScore, max_applications_per_day: maxApplicationsPerDay, auto_schedule: autoSchedule };
}

export interface AutopilotRunRow {
  id: string;
  status: AutopilotRunStatus;
  started_at: string;
  completed_at: string | null;
  jobs_found: number;
  drafts_created: number;
  applications_sent: number;
  error_message: string | null;
}

export interface AutopilotApprovalRow {
  id: string;
  run_id: string | null;
  type: ApprovalType;
  status: ApprovalStatus;
  job_listing_id: string | null;
  job_application_id: string | null;
  email_draft_subject: string | null;
  email_draft_body: string | null;
  email_to: string | null;
  resume_id: string | null;
  context: {
    company?: string;
    role?: string;
    matchScore?: number;
    applyUrl?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

/**
 * Scraped listings almost never expose a real recruiter inbox — RemoteOK/
 * WeWorkRemotely give an apply_url, usually a web-form/ATS link, not an
 * address. This pulls one out only when the listing genuinely hands us
 * one (a mailto: link, or an apply_url that's just a bare email address)
 * rather than guessing — anything else comes back null, and the approval
 * card asks the user to fill in a recipient via Edit & Approve before it
 * can be sent.
 */
export function extractEmailFromApplyUrl(applyUrl: string | null | undefined): string | null {
  if (!applyUrl) return null;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (applyUrl.startsWith("mailto:")) {
    const address = applyUrl.slice("mailto:".length).split("?")[0].trim();
    return EMAIL_PATTERN.test(address) ? address : null;
  }
  return EMAIL_PATTERN.test(applyUrl.trim()) ? applyUrl.trim() : null;
}
