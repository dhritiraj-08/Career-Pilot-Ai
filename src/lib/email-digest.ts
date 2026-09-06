export interface DigestEmailRow {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  sender: string | null;
  received_at: string | null;
  gmail_thread_id: string | null;
}

export interface DigestJobApplicationRow {
  id: string;
  status: string;
  applied_at: string | null;
  company: string | null;
}

export interface ActionRequiredItem {
  id: string;
  subject: string;
  sender: string;
  category: string;
}

export interface DailyDigest {
  newRecruiterEmails: number;
  interviewInvites: number;
  rejections: number;
  followUpsNeeded: number;
  actionRequired: ActionRequiredItem[];
}

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

const RESPONSE_WORTHY = new Set(["interview_invite", "offer", "recruiter_outreach"]);

/**
 * Computes the daily digest from already-synced data — no separate
 * scheduled job, since "gives daily digests" just means summarizing
 * what's already in the emails/job_applications tables, refreshed
 * whenever the page loads or a sync completes.
 *
 * followUpsNeeded ("jobs you applied to with no reply after 7 days")
 * has one real limitation worth being upfront about: it can only see
 * replies that arrived as synced Gmail inbox mail matching the
 * company name in the sender or subject (a real but approximate text
 * match, not a fabricated one) — it has no reliable way to link a
 * specific job_applications row to a specific inbound email without a
 * shared identifier between the two tables.
 */
export function computeDailyDigest(emails: DigestEmailRow[], jobApplications: DigestJobApplicationRow[]): DailyDigest {
  const newRecruiterEmails = emails.filter((e) => e.type === "recruiter_outreach" && isToday(e.received_at)).length;
  const interviewInvites = emails.filter((e) => e.type === "interview_invite" && isToday(e.received_at)).length;
  const rejections = emails.filter((e) => e.type === "rejection" && isToday(e.received_at)).length;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const followUpsNeeded = jobApplications.filter((app) => {
    if (app.status !== "applied" || !app.applied_at) return false;
    if (new Date(app.applied_at).getTime() > sevenDaysAgo) return false;
    if (!app.company) return true; // can't check for a reply without a company name to match against
    const companyLower = app.company.toLowerCase();
    const hasReply = emails.some(
      (e) =>
        e.received_at &&
        new Date(e.received_at).getTime() > new Date(app.applied_at!).getTime() &&
        ((e.sender ?? "").toLowerCase().includes(companyLower) || (e.subject ?? "").toLowerCase().includes(companyLower))
    );
    return !hasReply;
  }).length;

  const sentThreadIds = new Set(emails.filter((e) => e.status === "sent" && e.gmail_thread_id).map((e) => e.gmail_thread_id));
  const actionRequired: ActionRequiredItem[] = emails
    .filter((e) => e.status === "received" && RESPONSE_WORTHY.has(e.type) && !(e.gmail_thread_id && sentThreadIds.has(e.gmail_thread_id)))
    .sort((a, b) => new Date(b.received_at ?? 0).getTime() - new Date(a.received_at ?? 0).getTime())
    .slice(0, 8)
    .map((e) => ({ id: e.id, subject: e.subject ?? "(no subject)", sender: e.sender ?? "Unknown sender", category: e.type }));

  return { newRecruiterEmails, interviewInvites, rejections, followUpsNeeded, actionRequired };
}
