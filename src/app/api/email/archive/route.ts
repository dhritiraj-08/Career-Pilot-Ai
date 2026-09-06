import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getValidGmailToken } from "@/lib/gmail-tokens";
import { archiveMessage } from "@/lib/gmail";

interface RequestBody {
  emailId?: string;
}

/** Archives an email — not one of the explicitly listed backend
 * routes, but the "Archive" quick action needs somewhere to call.
 * Removes Gmail's INBOX label (standard archive semantics) rather than
 * deleting anything; the emails table has no separate "archived"
 * status to avoid another schema change for a UI-only concern — an
 * archived message simply won't come back from `in:inbox` on the next
 * sync. */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const emailId = body?.emailId?.trim();
  if (!emailId) {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  const { data: emailRow, error: fetchError } = await supabase
    .from("emails")
    .select("id, gmail_message_id")
    .eq("id", emailId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !emailRow || !emailRow.gmail_message_id) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const token = await getValidGmailToken(supabase, user.id);
  if (!token) {
    return NextResponse.json({ error: "Gmail isn't connected" }, { status: 400 });
  }

  try {
    await archiveMessage(token.accessToken, emailRow.gmail_message_id);
  } catch (err) {
    console.error("[email] archive failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't archive email" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
