import type { OpenRouterMessage } from "@/lib/ai/openrouter";
import type { ComposeType } from "@/lib/validations/email";
import { SYNC_CATEGORIES } from "@/lib/validations/email";

export interface EmailForCategorization {
  sender: string;
  subject: string;
  snippet: string;
}

/**
 * One call categorizes a whole batch of synced messages — cheaper and
 * far faster than one LLM call per email for a 100-message sync.
 * Messages are given back by their 1-based position in the prompt, not
 * an id string, and matched positionally on the way out (see
 * parseCategorization) rather than trusting the model to echo an
 * opaque id back correctly.
 */
export function buildCategorizationMessages(emails: EmailForCategorization[]): OpenRouterMessage[] {
  const list = emails
    .map((e, i) => `${i + 1}. From: ${e.sender}\n   Subject: ${e.subject}\n   Preview: ${e.snippet.slice(0, 200)}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are an email classifier for CareerPilot AI's job search inbox. Classify each numbered email into exactly one category:

- "recruiter_outreach": a recruiter or company reaching out about a potential role (not yet an interview or offer)
- "interview_invite": scheduling or confirming an interview
- "offer": an actual job offer
- "rejection": a rejection / "moving forward with other candidates" / application status: not selected
- "received": job/career related but doesn't fit the above (e.g. an application confirmation, a job alert, a newsletter)

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{ "categories": string[] }

Rules:
- The array must have exactly ${emails.length} entries, in the same order as the numbered list, one of: ${SYNC_CATEGORIES.join(", ")}.
- Base the category only on the actual sender/subject/preview given — don't guess beyond what's there.`,
    },
    {
      role: "user",
      content: list,
    },
  ];
}

export interface EmailForRelevanceCheck {
  sender: string;
  subject: string;
  snippet: string;
}

/** How many candidate emails go into one relevance-check call — batching
 * beats one call per email the same way categorization already does. */
export const RELEVANCE_BATCH_SIZE = 10;

/**
 * Step 2/3 of sync's filter: the real job-relevance decision, run only
 * on candidates that already passed the loose keyword pre-filter
 * (step 1). Deliberately sender+subject+snippet only — never the full
 * body — both because that's all a candidate has at this point (full
 * fetch happens only after this passes) and to keep this call cheap.
 */
export function buildRelevanceCheckMessages(emails: EmailForRelevanceCheck[]): OpenRouterMessage[] {
  const list = emails
    .map((e, i) => `${i + 1}. Sender: ${e.sender}\n   Subject: ${e.subject}\n   Preview: ${e.snippet.slice(0, 200)}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `Is each numbered email job-search related? Answer only YES or NO for each.

Job-related means: job applications, interview invitations, job offers, recruiter outreach, hiring process updates, internship opportunities, campus placement, rejection letters, or follow-up on a job application.
NOT job-related: payments, subscriptions, promotions, shipping, social media, news, entertainment, and anything else unrelated to a job search.

Respond with ONLY this exact format, all on one line, no commentary, no markdown:
1:YES 2:NO 3:YES ...

You must give exactly ${emails.length} answers, in the same order as the numbered list below.`,
    },
    {
      role: "user",
      content: list,
    },
  ];
}

export interface ComposeContext {
  company: string;
  role: string;
  highlights: string;
  recipientName: string;
}

const TYPE_INSTRUCTIONS: Record<ComposeType, string> = {
  application: "A cover-note style email accompanying a job application — concise, professional, expresses genuine interest in the role and connects the candidate's real highlights to it.",
  followup: "A polite follow-up on an application or interview that's had no response in a while — brief, doesn't sound impatient or entitled, reaffirms interest.",
  thankyou: "A thank-you note after an interview — genuine, references something specific from the conversation if given, reaffirms interest and fit.",
  cold: "Cold outreach to someone at a company the candidate wants to work for — respectful of their time, states a clear, specific reason for reaching out, easy to say no to without being pushy.",
};

export interface OriginalEmail {
  sender: string;
  subject: string;
  body: string;
}

/** Used by the email detail view's inline "AI suggested reply" — a
 * different concern from buildComposeMessages (which drafts a fresh
 * email from scratch), since a reply needs to actually respond to what
 * the original email said. */
export function buildReplyMessages(original: OriginalEmail, candidateName: string): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: `You are a professional email assistant for CareerPilot AI, drafting a suggested reply to a job-search-related email on the candidate's behalf.

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{ "body": string }

Rules:
- Reply directly to what the original email actually says — reference specifics from it rather than a generic response.
- Keep it concise and professional — 2-4 short paragraphs.
- Plain text (no markdown syntax), ready to send as-is or lightly edited.
- Sign off with the candidate's name if given.
- Never invent facts, dates, or commitments the candidate hasn't stated.`,
    },
    {
      role: "user",
      content: `CANDIDATE'S NAME: ${candidateName || "Not provided"}

ORIGINAL EMAIL:
From: ${original.sender}
Subject: ${original.subject}

${original.body.slice(0, 4000)}`,
    },
  ];
}

export function buildComposeMessages(type: ComposeType, ctx: ComposeContext): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: `You are a professional email writer for CareerPilot AI's Email Agent. Write ${TYPE_INSTRUCTIONS[type]}

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{ "subject": string, "body": string }

Rules:
- Keep the body concise — 3-5 short paragraphs at most, ready to send as-is or lightly edited.
- Only use facts given below — never invent specific achievements, employers, or numbers the candidate didn't provide.
- No bracketed placeholders like [Company Name] — use the actual details given, and if something is missing, write around it generically rather than leaving a placeholder.
- Plain text body (no markdown syntax), suitable for a real email.`,
    },
    {
      role: "user",
      content: `EMAIL TYPE: ${type}
COMPANY: ${ctx.company || "Not specified"}
ROLE: ${ctx.role || "Not specified"}
RECIPIENT: ${ctx.recipientName || "Not specified — use a generic greeting"}
CANDIDATE'S HIGHLIGHTS TO REFERENCE: ${ctx.highlights || "None given — keep it general"}`,
    },
  ];
}
