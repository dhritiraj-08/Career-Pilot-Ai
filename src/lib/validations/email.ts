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

// A message must match at least one of these (case-insensitive, in
// subject or snippet) to be treated as job-related at all during sync
// — cuts an inbox of 100 recent emails down before spending an LLM
// call on categorizing the rest.
export const JOB_KEYWORDS = [
  "application", "applied", "interview", "offer", "rejection", "unfortunately",
  "opportunity", "position", "role", "hiring", "recruiter", "recruitment",
  "hr", "talent", "candidate", "resume", "cv", "job", "career", "onboarding",
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
