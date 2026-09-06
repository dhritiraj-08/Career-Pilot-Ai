import { z } from "zod";

// The four categories emails table's expanded type check constraint
// added specifically for Gmail-synced mail (see docs/schema.sql) — one
// per left-panel category that isn't already covered by an
// app-authored type (application/follow_up/thank_you/offer_response).
export const EMAIL_CATEGORIES = [
  "application",
  "recruiter_outreach",
  "interview_invite",
  "offer",
  "rejection",
  "follow_up",
  "thank_you",
  "offer_response",
  "received",
  "other",
] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<EmailCategory, string> = {
  application: "Job Applications",
  recruiter_outreach: "Recruiter Emails",
  interview_invite: "Interview Invites",
  offer: "Offer Letters",
  rejection: "Rejections",
  follow_up: "Follow-ups",
  thank_you: "Thank You",
  offer_response: "Offer Responses",
  received: "Other Received",
  other: "Other",
};

// Categories Gmail sync can actually assign to an incoming message —
// narrower than EMAIL_CATEGORIES, which also includes types the app
// itself assigns when the user sends mail (application/follow_up/
// thank_you/offer_response are chosen by the compose flow, not by
// sync's classifier).
export const SYNC_CATEGORIES = ["recruiter_outreach", "interview_invite", "offer", "rejection", "received"] as const;
export type SyncCategory = (typeof SYNC_CATEGORIES)[number];

export const COMPOSE_TYPES = ["application", "followup", "thankyou", "cold"] as const;
export type ComposeType = (typeof COMPOSE_TYPES)[number];

export const COMPOSE_TYPE_LABELS: Record<ComposeType, string> = {
  application: "Job Application",
  followup: "Follow Up",
  thankyou: "Thank You",
  cold: "Cold Outreach",
};

// Step 1 of sync's two-step filter: a deliberately loose pre-filter
// checked only against subject/sender (case-insensitive) — just to cut
// an inbox of a few thousand down to a couple hundred candidates before
// spending anything on AI. Being loose here is fine (Spotify/iCloud/
// payment mail can still slip through "job" or "role" appearing
// somewhere) because step 2 (the batched AI relevance check below) is
// the actual filter; this step exists only to bound API/LLM cost.
export const LOOSE_JOB_KEYWORDS = [
  "interview", "offer", "hiring", "recruiter", "talent", "career",
  "application", "position", "role", "job", "opportunity", "hr",
  "placement", "internship", "campus",
];

// Step 2's deterministic fallback, used only when the batched AI
// relevance call itself fails (network/timeout/malformed response) —
// deliberately narrower and more specific than LOOSE_JOB_KEYWORDS so
// this backup doesn't reintroduce the same false positives (a generic
// "role"/"career" match) that the AI step exists to filter out.
export const STRICT_JOB_KEYWORDS = [
  "job offer", "offer of employment", "interview invitation", "interview scheduled",
  "phone screen", "technical interview", "application received", "thank you for applying",
  "regret to inform", "not moving forward", "other candidates", "not selected",
  "recruiter", "talent acquisition", "hiring manager", "campus placement",
  "internship offer", "shortlisted", "your application for", "your application to",
];

/** Matches the emails table row shape as selected in
 * app/(dashboard)/dashboard/email/page.tsx — shared so the client
 * components don't redefine it. */
export interface EmailRow {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  body: string | null;
  sender: string | null;
  sender_email: string | null;
  recipient: string | null;
  gmail_thread_id: string | null;
  received_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface SyncedEmail {
  id: string;
  gmailMessageId: string;
  gmailThreadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: string;
  category: EmailCategory;
  status: string;
}

// ---------------------------------------------------------------------
// LLM categorization response — one batch call classifies many
// messages at once (see lib/ai/prompts/email.ts), matched back to the
// original message by index rather than trusting the model to echo an
// id string correctly.
// ---------------------------------------------------------------------
const rawCategorizationSchema = z.object({
  categories: z.array(z.enum(SYNC_CATEGORIES)).nullable().optional(),
});

export function parseCategorization(raw: unknown, expectedCount: number): SyncCategory[] {
  const parsed = rawCategorizationSchema.safeParse(raw);
  const categories = parsed.success ? parsed.data.categories ?? [] : [];
  return Array.from({ length: expectedCount }, (_, i) => categories[i] ?? "received");
}

// ---------------------------------------------------------------------
// LLM relevance-check response — step 2/3 of sync's filter. One batch
// call answers YES/NO for up to RELEVANCE_BATCH_SIZE candidate emails
// at once, in a plain "1:YES 2:NO ..." line rather than JSON (cheaper
// for the model to produce reliably for a simple per-item boolean, and
// easy to parse position-by-position with a regex regardless of the
// model's exact spacing/casing).
// ---------------------------------------------------------------------

/** Parses "1:YES 2:NO 3:yes ..." into an array of booleans (or `null`
 * for any position the model didn't answer). Throws if it found no
 * recognizable answers at all, so the caller can tell "the model
 * answered some of these oddly" (partial — fill gaps from the caller's
 * own fallback per email) apart from "this call produced garbage"
 * (total failure — fall back for the whole batch). */
export function parseRelevanceBatch(raw: string, expectedCount: number): (boolean | null)[] {
  const results: (boolean | null)[] = new Array(expectedCount).fill(null);
  let found = 0;
  for (const m of Array.from(raw.matchAll(/(\d+)\s*:\s*(YES|NO)/gi))) {
    const idx = Number(m[1]) - 1;
    if (idx >= 0 && idx < expectedCount) {
      results[idx] = m[2].toUpperCase() === "YES";
      found++;
    }
  }
  if (found === 0) {
    throw new Error("No YES/NO answers found in relevance-check response");
  }
  return results;
}

// ---------------------------------------------------------------------
// LLM compose response
// ---------------------------------------------------------------------
const rawComposeSchema = z.object({
  subject: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
});

export interface ComposedEmail {
  subject: string;
  body: string;
}

export function parseComposedEmail(raw: unknown): ComposedEmail {
  const parsed = rawComposeSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};
  return {
    subject: data.subject?.trim() || "Following up",
    body: data.body?.trim() || "",
  };
}
