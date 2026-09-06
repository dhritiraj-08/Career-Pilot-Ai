import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getValidGmailToken } from "@/lib/gmail-tokens";
import { sendGmailMessage } from "@/lib/gmail";
import { runInterviewStart } from "@/lib/agents/interview";
import type { EmailCategory } from "@/lib/validations/email";

// Interview-prep question generation is its own LLM call on top of the
// send itself.
export const maxDuration = 60;

const DEFAULT_INTERVIEW_TYPE = "mixed" as const;
const DEFAULT_QUESTION_COUNT = 10;

interface RequestBody {
  // "Edit & Approve" sends these instead of the stored draft — also
  // persisted back onto the approval row so the record reflects what
  // was actually sent, not the original AI draft.
  subject?: string;
  body?: string;
  to?: string;
}

// Outbound mail has no "interview_reply" category of its own in
// emails.type (see docs/schema.sql) — that category exists for mail
// Gmail *sync* classifies as received, not for what this app sends.
// "other" is the closest fit for a sent interview reply.
const APPROVAL_TYPE_TO_EMAIL_TYPE: Record<string, EmailCategory> = {
  job_application: "application",
  followup: "follow_up",
  interview_reply: "other",
};

/**
 * User approves a drafted item: sends it via Gmail, records the sent
 * email, flips the approval to "sent", and (for a job application)
 * moves the linked job_applications row to "applied".
 */
export async function POST(request: Request, { params }: { params: { approvalId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: approval, error: fetchError } = await supabase
    .from("autopilot_approvals")
    .select("*")
    .eq("id", params.approvalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }
  if (approval.status !== "pending") {
    return NextResponse.json({ error: `Already ${approval.status}` }, { status: 400 });
  }

  const requestBody = (await request.json().catch(() => null)) as RequestBody | null;
  const subject = requestBody?.subject?.trim() || approval.email_draft_subject || "";
  const body = requestBody?.body?.trim() || approval.email_draft_body || "";
  const to = requestBody?.to?.trim() || approval.email_to || "";

  if (!to || !subject || !body) {
    return NextResponse.json(
      { error: "This draft needs a recipient, subject, and body — use Edit & Approve to fill in what's missing." },
      { status: 400 }
    );
  }

  const token = await getValidGmailToken(supabase, user.id);
  if (!token) {
    return NextResponse.json({ error: "Connect Gmail before approving — Autopilot needs it to send" }, { status: 400 });
  }

  let sent;
  try {
    sent = await sendGmailMessage(token.accessToken, { to, subject, body });
  } catch (err) {
    console.error("[autopilot] send failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't send — Gmail rejected the request" }, { status: 502 });
  }

  const emailType = APPROVAL_TYPE_TO_EMAIL_TYPE[approval.type] ?? "other";
  await supabase.from("emails").insert({
    user_id: user.id,
    type: emailType,
    subject,
    body,
    recipient: to,
    sender: token.email,
    sender_email: token.email,
    status: "sent",
    sent_at: new Date().toISOString(),
    gmail_message_id: sent.id,
    gmail_thread_id: sent.threadId,
  });

  await supabase
    .from("autopilot_approvals")
    .update({ status: "sent", email_draft_subject: subject, email_draft_body: body, email_to: to })
    .eq("id", approval.id);

  if (approval.type === "job_application" && approval.job_application_id) {
    await supabase
      .from("job_applications")
      .update({ status: "applied", applied_at: new Date().toISOString() })
      .eq("id", approval.job_application_id);
  }

  if (approval.run_id) {
    const { data: run } = await supabase
      .from("autopilot_runs")
      .select("applications_sent")
      .eq("id", approval.run_id)
      .maybeSingle();
    await supabase
      .from("autopilot_runs")
      .update({ applications_sent: (run?.applications_sent ?? 0) + 1 })
      .eq("id", approval.run_id);
  }

  const approvalContext = (approval.context ?? {}) as { company?: string; role?: string; matchScore?: number; applyUrl?: string | null };
  const company = approvalContext.company;
  await supabase.from("notifications").insert({
    user_id: user.id,
    title: `Sent${company ? `: ${company}` : ""}`,
    message: "Your email was sent.",
    type: "success",
    link: "/dashboard/autopilot",
  });

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "orchestrator",
    action: `Sent ${approval.type.replace("_", " ")}${company ? ` to ${company}` : ""}`,
    status: "success",
    details: { run_id: approval.run_id, approval_id: approval.id },
  });

  // Approving a job application also preps for the interview that
  // might follow — generates a real question set now (not a stub),
  // using sensible defaults (a mixed technical/HR set, 10 questions)
  // since nothing at approval time tells us which type/length the user
  // would have picked on the Interview page themselves. Best-effort:
  // the application was already sent above, so a failure here is
  // logged and skipped rather than failing this whole request.
  let interviewSessionId: string | null = null;
  if (approval.type === "job_application" && approval.job_listing_id && approval.resume_id) {
    const { data: listing } = await supabase
      .from("job_listings")
      .select("title, company, description")
      .eq("id", approval.job_listing_id)
      .maybeSingle();

    if (listing) {
      const interviewResult = await runInterviewStart(supabase, user.id, {
        resumeId: approval.resume_id,
        targetRole: listing.title,
        company: listing.company,
        jobDescription: listing.description ?? "",
        interviewType: DEFAULT_INTERVIEW_TYPE,
        questionCount: DEFAULT_QUESTION_COUNT,
      });

      if ("error" in interviewResult) {
        console.error(`[autopilot] interview-prep failed for approval ${approval.id}:`, interviewResult.error);
      } else {
        interviewSessionId = interviewResult.sessionId;

        // Folded into the approval's own context so its card in the
        // Sent section can show an "Interview prep ready" link too,
        // not just the standalone notification.
        await supabase
          .from("autopilot_approvals")
          .update({ context: { ...approvalContext, interviewSessionId } })
          .eq("id", approval.id);

        await supabase.from("notifications").insert({
          user_id: user.id,
          title: `Interview prep ready for ${listing.company}`,
          message: `A mock interview for ${listing.title} is ready whenever you want to practice.`,
          type: "info",
          link: `/dashboard/interview?sessionId=${interviewSessionId}`,
        });

        await supabase.from("agent_activities").insert({
          user_id: user.id,
          agent_name: "orchestrator",
          action: `Prepped a mock interview for ${listing.title} at ${listing.company}`,
          status: "success",
          details: { run_id: approval.run_id, approval_id: approval.id },
        });
      }
    }
  }

  return NextResponse.json({ success: true, messageId: sent.id, interviewSessionId });
}
