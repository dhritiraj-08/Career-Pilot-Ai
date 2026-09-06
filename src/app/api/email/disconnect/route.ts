import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { revokeGoogleToken } from "@/lib/gmail";
import { decrypt } from "@/lib/crypto";

/** Disconnects Gmail: revokes the token with Google (best-effort — the
 * user's own stored copy is removed either way) and deletes the
 * oauth_tokens row, per the "user can disconnect and revoke access at
 * any time" requirement. */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row } = await supabase
    .from("oauth_tokens")
    .select("access_token, email")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .maybeSingle();

  if (row) {
    try {
      await revokeGoogleToken(decrypt(row.access_token));
    } catch (err) {
      console.error("[email] token revoke failed (continuing to remove local copy):", err instanceof Error ? err.message : err);
    }
  }

  const { error: deleteError } = await supabase
    .from("oauth_tokens")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "gmail");

  if (deleteError) {
    console.error("[email] failed to delete oauth_tokens row:", deleteError.message);
    return NextResponse.json({ error: "Couldn't disconnect Gmail" }, { status: 500 });
  }

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "email_agent",
    action: `Disconnected Gmail${row?.email ? ` (${row.email})` : ""}`,
    status: "success",
  });

  return NextResponse.json({ success: true });
}
