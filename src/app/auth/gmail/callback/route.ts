import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, fetchConnectedEmail } from "@/lib/gmail";
import { encrypt } from "@/lib/crypto";

const STATE_COOKIE = "gmail_oauth_state";

function redirectWithError(origin: string, error: string) {
  const url = new URL("/dashboard/email", origin);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

/**
 * Gmail OAuth callback — exchanges the authorization code for tokens,
 * finds out which Gmail address was actually connected, and stores the
 * tokens encrypted (see lib/crypto.ts) in oauth_tokens. Relies on the
 * user's own Supabase session cookie still being present on this
 * same-origin redirect back (same approach as the existing Supabase
 * /auth/callback route), rather than encoding the user id in `state`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error"); // e.g. "access_denied" if the user declined consent

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  if (oauthError) {
    return redirectWithError(origin, oauthError);
  }

  const expectedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError(origin, "invalid_state");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refreshToken) {
      // Can happen if the user previously connected and this consent
      // didn't re-prompt for some reason — access_type=offline +
      // prompt=consent should prevent this, but fail clearly rather
      // than silently storing a token that can't be refreshed later.
      throw new Error("Google didn't return a refresh token — try disconnecting and reconnecting");
    }
    const email = await fetchConnectedEmail(tokens.accessToken);
    const tokenExpiry = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();

    const { error: upsertError } = await supabase.from("oauth_tokens").upsert(
      {
        user_id: user.id,
        provider: "gmail",
        access_token: encrypt(tokens.accessToken),
        refresh_token: encrypt(tokens.refreshToken),
        token_expiry: tokenExpiry,
        email,
      },
      { onConflict: "user_id,provider" }
    );
    if (upsertError) {
      console.error("[email] failed to store Gmail tokens:", upsertError.message);
      return redirectWithError(origin, "storage_failed");
    }

    await supabase.from("agent_activities").insert({
      user_id: user.id,
      agent_name: "email_agent",
      action: `Connected Gmail (${email})`,
      status: "success",
    });

    const response = NextResponse.redirect(new URL("/dashboard/email?connected=1", origin));
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (err) {
    console.error("[email] Gmail connect failed:", err instanceof Error ? err.message : err);
    return redirectWithError(origin, "connect_failed");
  }
}
