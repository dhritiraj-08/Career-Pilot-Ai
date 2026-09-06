import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getValidGmailToken } from "@/lib/gmail-tokens";
import { sendGmailMessage } from "@/lib/gmail";
import { EMAIL_CATEGORIES, type EmailCategory } from "@/lib/validations/email";

interface RequestBody {
  to?: string;
  subject?: string;
  body?: string;
  threadId?: string;
  type?: string;
}

/** Sends a real email via the connected Gmail account and records it
 * in the emails table. Never logs `to`/`subject`/`body` to the
 * console — only Gmail's own structured API errors, which carry no
 * message content. */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestBody = (await request.json().catch(() => null)) as RequestBody | null;
  const to = requestBody?.to?.trim();
  const subject = requestBody?.subject?.trim();
  const body = requestBody?.body?.trim();
  const threadId = requestBody?.threadId?.trim() || undefined;
  const rawType = requestBody?.type as EmailCategory | undefined;
  const type: EmailCategory = rawType && EMAIL_CATEGORIES.includes(rawType) ? rawType : "other";

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "to, subject, and body are all required" }, { status: 400 });
  }

  const token = await getValidGmailToken(supabase, user.id);
  if (!token) {
    return NextResponse.json({ error: "Gmail isn't connected" }, { status: 400 });
  }

  let sent;
  try {
    sent = await sendGmailMessage(token.accessToken, { to, subject, body, threadId });
  } catch (err) {
    console.error("[email] send failed:", err instanceof Error ? err.message : err);

    await supabase.from("emails").insert({
      user_id: user.id,
      type,
      subject,
      body,
      recipient: to,
      sender: token.email,
      sender_email: token.email,
      status: "failed",
    });

    return NextResponse.json({ error: "Couldn't send email — Gmail rejected the request" }, { status: 502 });
  }

  const { error: insertError } = await supabase.from("emails").insert({
    user_id: user.id,
    type,
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
  if (insertError) {
    console.error("[email] sent but failed to save record:", insertError.message);
  }

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "email_agent",
    action: `Sent a ${type} email`,
    status: "success",
  });

  return NextResponse.json({ success: true, messageId: sent.id, threadId: sent.threadId });
}
