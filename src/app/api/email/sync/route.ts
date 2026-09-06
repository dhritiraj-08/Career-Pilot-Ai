import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getValidGmailToken } from "@/lib/gmail-tokens";
import { listRecentMessageIds, getMessageMetadata, getMessageFull } from "@/lib/gmail";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildCategorizationMessages, buildRelevanceCheckMessages, RELEVANCE_BATCH_SIZE } from "@/lib/ai/prompts/email";
import { fallbackCategorize, fallbackIsJobRelated } from "@/lib/ai/fallbacks/email";
import { parseCategorization, parseRelevanceBatch, LOOSE_JOB_KEYWORDS, type SyncCategory } from "@/lib/validations/email";
import { mapWithConcurrency, chunk } from "@/lib/utils";

const MAX_MESSAGES = 100;
const FETCH_CONCURRENCY = 8;
// Relevance-check batches are their own OpenRouter calls — kept low so
// a sync doesn't fire a dozen LLM requests at once.
const RELEVANCE_CONCURRENCY = 3;

// Metadata fetches for up to 100 messages, a batched relevance check,
// then full fetches + one categorization call for whatever's left —
// comfortably needs more than the platform default.
export const maxDuration = 60;

// Step 1 — loose pre-filter: only cuts inbox volume down before
// anything is sent to an LLM. See LOOSE_JOB_KEYWORDS for why this is
// deliberately permissive (Spotify/iCloud/payment mail can still pass
// this on a stray "job"/"role" match) — step 2 below is the real filter.
function matchesLooseKeywords(subject: string, sender: string): boolean {
  const text = `${subject} ${sender}`.toLowerCase();
  return LOOSE_JOB_KEYWORDS.some((kw) => text.includes(kw));
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

  // Step 1 — loose pre-filter (subject OR sender). Just volume control:
  // an inbox of a few thousand becomes a couple hundred candidates
  // before anything reaches an LLM.
  const candidates = metadataResults.filter(
    (m): m is NonNullable<typeof m> => m !== null && matchesLooseKeywords(m.subject, m.sender)
  );

  if (candidates.length === 0) {
    return NextResponse.json({ newCount: 0, categoryCounts: {}, message: "No new job-related emails found." });
  }

  // Step 2/3 — the real filter: a batched AI YES/NO relevance check
  // over sender+subject+snippet (never the full body — that's not
  // fetched yet at this point anyway). Batches run with limited
  // concurrency; a batch whose call fails or comes back unparseable
  // falls back to the stricter deterministic keyword check per email,
  // rather than failing (or silently admitting) the whole batch.
  let usedRelevanceFallback = false;
  const batches = chunk(candidates, RELEVANCE_BATCH_SIZE);
  const relevanceFlags = await mapWithConcurrency(batches, RELEVANCE_CONCURRENCY, async (batch) => {
    try {
      const raw = await callOpenRouter({
        messages: buildRelevanceCheckMessages(batch.map((m) => ({ sender: m.sender, subject: m.subject, snippet: m.snippet }))),
      });
      const parsed = parseRelevanceBatch(raw, batch.length);
      return parsed.map((flag, i) => {
        if (flag !== null) return flag;
        // The model skipped this position — fall back for just this one.
        usedRelevanceFallback = true;
        return fallbackIsJobRelated(batch[i].subject, batch[i].sender, batch[i].snippet);
      });
    } catch (err) {
      console.error("[email-sync] relevance check failed for a batch — using keyword fallback:", err instanceof Error ? err.message : err);
      usedRelevanceFallback = true;
      return batch.map((m) => fallbackIsJobRelated(m.subject, m.sender, m.snippet));
    }
  });
  const isRelevant = relevanceFlags.flat();

  const jobRelated = candidates.filter((_, i) => isRelevant[i]);

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
  let usedCategorizationFallback = false;
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
    usedCategorizationFallback = true;
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

  // Structural metadata only — never subject/body/sender/recipient values.
  // A row's shape (which columns are populated, which `type` values are
  // being attempted) is everything needed to diagnose a schema mismatch
  // like a missing column or a check-constraint rejecting a category
  // value, without putting real email content in server logs.
  console.log("[email-sync] about to insert into emails:", {
    rowCount: rows.length,
    distinctTypes: Array.from(new Set(rows.map((r) => r.type))),
    typeCounts: rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    }, {}),
    sampleRowShape: Object.fromEntries(
      Object.entries(rows[0]).map(([key, value]) => [
        key,
        typeof value === "string" ? `string(${value.length})` : value,
      ])
    ),
    anyMissingSenderEmail: rows.some((r) => !r.sender_email),
    anyMissingGmailIds: rows.some((r) => !r.gmail_message_id || !r.gmail_thread_id),
  });

  const { error: insertError } = await supabase.from("emails").insert(rows);
  if (insertError) {
    console.error("[email-sync] insert into emails FAILED — full Supabase error:", {
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      code: insertError.code,
    });
    return NextResponse.json({ error: "Couldn't save synced emails" }, { status: 500 });
  }

  console.log("[email-sync] insert succeeded:", { insertedCount: rows.length });

  const categoryCounts: Record<string, number> = {};
  for (const c of categories) categoryCounts[c] = (categoryCounts[c] ?? 0) + 1;

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "email_agent",
    action: `Synced ${fetched.length} job-related email${fetched.length === 1 ? "" : "s"} from Gmail`,
    status: "success",
    details: { usedRelevanceFallback, usedCategorizationFallback, categoryCounts, candidatesChecked: candidates.length },
  });

  return NextResponse.json({
    newCount: fetched.length,
    categoryCounts,
    usedFallback: usedRelevanceFallback || usedCategorizationFallback,
  });
}
