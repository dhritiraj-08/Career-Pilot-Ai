import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getValidGmailToken } from "@/lib/gmail-tokens";
import { listRecentMessageIds, getMessageMetadata, getMessageFull } from "@/lib/gmail";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildCategorizationMessages } from "@/lib/ai/prompts/email";
import { fallbackCategorize } from "@/lib/ai/fallbacks/email";
import { parseCategorization, JOB_KEYWORDS, type SyncCategory } from "@/lib/validations/email";
import { mapWithConcurrency } from "@/lib/utils";

const MAX_MESSAGES = 100;
const FETCH_CONCURRENCY = 8;

// Metadata fetches for up to 100 messages, then full fetches for
// however many pass the keyword filter, then one categorization call —
// comfortably needs more than the platform default.
export const maxDuration = 60;

function matchesJobKeywords(subject: string, snippet: string): boolean {
  const text = `${subject} ${snippet}`.toLowerCase();
  return JOB_KEYWORDS.some((kw) => text.includes(kw));
}

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getValidGmailToken(supabase, user.id);
  if (!token) {
    return NextResponse.json({ error: "Gmail isn't connected" }, { status: 400 });
  }

  let messageIds: string[];
  try {
    messageIds = await listRecentMessageIds(token.accessToken, MAX_MESSAGES);
  } catch (err) {
    // Errors here are Gmail API status/reason codes, never message
    // content — see lib/gmail.ts.
    console.error("[email] Gmail list failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't reach Gmail — try Sync Now again shortly" }, { status: 502 });
  }

  // Skip messages already synced (by Gmail's own id) before spending
  // any API calls or LLM cost re-processing them on a repeat sync.
  const { data: existingRows } = await supabase
    .from("emails")
    .select("gmail_message_id")
    .eq("user_id", user.id)
    .not("gmail_message_id", "is", null);
  const alreadySynced = new Set((existingRows ?? []).map((r) => r.gmail_message_id));
  const newMessageIds = messageIds.filter((id) => !alreadySynced.has(id));

  if (newMessageIds.length === 0) {
    return NextResponse.json({ newCount: 0, categoryCounts: {}, message: "No new job-related emails found." });
  }

  const metadataResults = await mapWithConcurrency(newMessageIds, FETCH_CONCURRENCY, async (id) => {
    try {
      return await getMessageMetadata(token.accessToken, id);
    } catch (err) {
      console.error("[email] failed to fetch message metadata:", err instanceof Error ? err.message : err);
      return null;
    }
  });

  const jobRelated = metadataResults.filter(
    (m): m is NonNullable<typeof m> => m !== null && matchesJobKeywords(m.subject, m.snippet)
  );

  if (jobRelated.length === 0) {
    return NextResponse.json({ newCount: 0, categoryCounts: {}, message: "No new job-related emails found." });
  }

  const fullMessages = await mapWithConcurrency(jobRelated, FETCH_CONCURRENCY, async (m) => {
    try {
      return await getMessageFull(token.accessToken, m.id);
    } catch (err) {
      console.error("[email] failed to fetch full message:", err instanceof Error ? err.message : err);
      return null;
    }
  });
  const fetched = fullMessages.filter((m): m is NonNullable<typeof m> => m !== null);

  let categories: SyncCategory[];
  let usedFallback = false;
  try {
    const raw = await callOpenRouter({
      messages: buildCategorizationMessages(fetched.map((m) => ({ sender: m.sender, subject: m.subject, snippet: m.snippet }))),
      jsonMode: true,
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in categorization response");
    categories = parseCategorization(JSON.parse(jsonMatch[0]), fetched.length);
  } catch (err) {
    console.error("[email] categorization failed:", err instanceof Error ? err.message : err);
    usedFallback = true;
    categories = fetched.map((m) => fallbackCategorize(m.subject, m.snippet));
  }

  const rows = fetched.map((m, i) => ({
    user_id: user.id,
    type: categories[i],
    subject: m.subject,
    body: m.body,
    recipient: token.email,
    sender: m.sender,
    sender_email: m.senderEmail,
    status: "received" as const,
    received_at: m.receivedAt,
    gmail_message_id: m.id,
    gmail_thread_id: m.threadId,
  }));

  const { error: insertError } = await supabase.from("emails").insert(rows);
  if (insertError) {
    console.error("[email] failed to save synced emails:", insertError.message);
    return NextResponse.json({ error: "Couldn't save synced emails" }, { status: 500 });
  }

  const categoryCounts: Record<string, number> = {};
  for (const c of categories) categoryCounts[c] = (categoryCounts[c] ?? 0) + 1;

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "email_agent",
    action: `Synced ${fetched.length} job-related email${fetched.length === 1 ? "" : "s"} from Gmail`,
    status: "success",
    details: { usedFallback, categoryCounts },
  });

  return NextResponse.json({ newCount: fetched.length, categoryCounts, usedFallback });
}
