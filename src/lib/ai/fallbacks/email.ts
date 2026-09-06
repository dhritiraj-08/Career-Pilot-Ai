import type { ComposeType } from "@/lib/validations/email";
import type { SyncCategory } from "@/lib/validations/email";
import { STRICT_JOB_KEYWORDS } from "@/lib/validations/email";
import type { ComposeContext, OriginalEmail } from "@/lib/ai/prompts/email";

/**
 * Deterministic backup for the batched AI relevance check (step 2/3 of
 * sync's filter) — used only when that LLM call fails outright or comes
 * back unparseable. Checked against STRICT_JOB_KEYWORDS rather than the
 * loose step-1 list, so a failed AI call doesn't silently fall back to
 * the same generic matching the AI step exists to improve on.
 */
export function fallbackIsJobRelated(subject: string, sender: string, snippet: string): boolean {
  const text = `${subject} ${sender} ${snippet}`.toLowerCase();
  return STRICT_JOB_KEYWORDS.some((kw) => text.includes(kw));
}

/**
 * Deterministic keyword-based categorization — real heuristics against
 * the actual subject/snippet text, not a fabricated guess, used only
 * if the categorization LLM call fails outright. Order matters: checked
 * most-specific-first so e.g. an interview invite that also happens to
 * mention "recruiter" still lands as interview_invite.
 */
export function fallbackCategorize(subject: string, snippet: string): SyncCategory {
  const text = `${subject} ${snippet}`.toLowerCase();

  if (/(unfortunately|not moving forward|other candidates|decided not to proceed|not selected|regret to inform)/.test(text)) {
    return "rejection";
  }
  if (/(pleased to offer|offer of employment|job offer|extend an offer|welcome to the team)/.test(text)) {
    return "offer";
  }
  if (/(interview|schedule a call|phone screen|technical screen|meet the team|available for a call)/.test(text)) {
    return "interview_invite";
  }
  if (/(recruiter|talent acquisition|sourcing|reaching out|opportunity at|hiring for|open role)/.test(text)) {
    return "recruiter_outreach";
  }
  return "received";
}

const COMPOSE_TEMPLATES: Record<ComposeType, (ctx: ComposeContext) => { subject: string; body: string }> = {
  application: (ctx) => ({
    subject: `Application for ${ctx.role || "the role"}${ctx.company ? ` at ${ctx.company}` : ""}`,
    body: `Dear ${ctx.recipientName || "Hiring Manager"},\n\nI'm writing to express my interest in the ${ctx.role || "open"} position${ctx.company ? ` at ${ctx.company}` : ""}. ${ctx.highlights ? `My background includes ${ctx.highlights}, which I believe aligns well with what you're looking for.` : "I believe my background aligns well with what you're looking for."}\n\nI'd welcome the opportunity to discuss how I can contribute to your team.\n\nBest regards`,
  }),
  followup: (ctx) => ({
    subject: `Following up${ctx.role ? ` on my application for ${ctx.role}` : ""}${ctx.company ? ` at ${ctx.company}` : ""}`,
    body: `Dear ${ctx.recipientName || "Hiring Manager"},\n\nI wanted to follow up on my application${ctx.role ? ` for the ${ctx.role} position` : ""}${ctx.company ? ` at ${ctx.company}` : ""}. I remain very interested in the opportunity and would appreciate any update on the timeline.\n\nThank you for your time.\n\nBest regards`,
  }),
  thankyou: (ctx) => ({
    subject: `Thank you${ctx.company ? ` — ${ctx.company}` : ""}`,
    body: `Dear ${ctx.recipientName || "Hiring Team"},\n\nThank you for taking the time to speak with me${ctx.role ? ` about the ${ctx.role} position` : ""}${ctx.company ? ` at ${ctx.company}` : ""}. I enjoyed our conversation and remain very enthusiastic about the opportunity.\n\nPlease let me know if there's anything further I can provide.\n\nBest regards`,
  }),
  cold: (ctx) => ({
    subject: `${ctx.company ? `Interested in opportunities at ${ctx.company}` : "Reaching out"}`,
    body: `Dear ${ctx.recipientName || "there"},\n\nI'm reaching out because I'm very interested in${ctx.company ? ` ${ctx.company}` : " your team"}${ctx.role ? ` and the work being done in ${ctx.role}-related roles` : ""}. ${ctx.highlights ? `My background includes ${ctx.highlights}.` : ""}\n\nI'd love to connect if you're open to it — no worries at all if now isn't the right time.\n\nBest regards`,
  }),
};

/** Real, if generic, templates built only from the context actually
 * given — used only if compose generation fails outright. */
export function fallbackComposeEmail(type: ComposeType, ctx: ComposeContext) {
  return COMPOSE_TEMPLATES[type](ctx);
}

/** Used only if reply-suggestion generation fails outright — an
 * honest placeholder rather than a fabricated response to content the
 * fallback has no way to actually read and respond to. */
export function fallbackReply(original: OriginalEmail, candidateName: string): { body: string } {
  return {
    body: `Hi ${original.sender.split(" ")[0] || "there"},\n\nThank you for your email. I wanted to follow up${original.subject ? ` regarding "${original.subject}"` : ""} — I'll get back to you with a full response shortly.\n\nBest regards,\n${candidateName || ""}`.trim(),
  };
}
