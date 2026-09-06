import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { encrypt, decrypt } from "@/lib/crypto";
import { refreshAccessToken } from "@/lib/gmail";

export interface StoredGmailToken {
  accessToken: string;
  refreshToken: string;
  email: string;
}

/**
 * Fetches this user's stored Gmail token, transparently refreshing the
 * access token (and persisting the refreshed one, re-encrypted) if
 * it's expired or about to expire — every route that talks to Gmail
 * goes through this rather than reading oauth_tokens directly, so
 * refresh-on-demand only has to be implemented once. Returns null if
 * Gmail isn't connected for this user.
 */
export async function getValidGmailToken(supabase: SupabaseClient, userId: string): Promise<StoredGmailToken | null> {
  const { data: row } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, token_expiry, email")
    .eq("user_id", userId)
    .eq("provider", "gmail")
    .maybeSingle();

  if (!row) return null;

  const refreshToken = decrypt(row.refresh_token);
  const expiresAt = new Date(row.token_expiry).getTime();
  const isExpiringSoon = expiresAt - Date.now() < 60_000; // refresh a minute early rather than right at expiry

  if (!isExpiringSoon) {
    return { accessToken: decrypt(row.access_token), refreshToken, email: row.email };
  }

  const refreshed = await refreshAccessToken(refreshToken);
  const newExpiry = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString();
  await supabase
    .from("oauth_tokens")
    .update({ access_token: encrypt(refreshed.accessToken), token_expiry: newExpiry })
    .eq("user_id", userId)
    .eq("provider", "gmail");

  return { accessToken: refreshed.accessToken, refreshToken, email: row.email };
}
