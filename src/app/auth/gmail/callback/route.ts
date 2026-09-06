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
 *
 * TEMPORARY: verbose [gmail-callback] logging added at every step to
 * debug a live "Couldn't connect Gmail" failure — no logic changed.
 * Token/code VALUES are never logged in full (only presence/length/a
 * short prefix) even though this isn't "email content" — they're live
 * credentials, and OAuth authorization codes/tokens landing in full in
 * a terminal log is worth avoiding on principle, not just for the
 * literal security rule about email content.
 */
export async function GET(request: Request) {
  console.log("[gmail-callback] ---- callback hit ----");
  console.log("[gmail-callback] full request URL:", request.url);

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error"); // e.g. "access_denied" if the user declined consent
  const oauthErrorDescription = searchParams.get("error_description");

  console.log("[gmail-callback] params received:", {
    hasCode: Boolean(code),
    codePrefix: code ? `${code.slice(0, 10)}...(${code.length} chars)` : null,
    state,
    error: oauthError,
    errorDescription: oauthErrorDescription,
  });

  const supabase = createClient();
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  console.log("[gmail-callback] supabase.auth.getUser() result:", {
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    getUserError: getUserError?.message ?? null,
  });

  if (!user) {
    console.log("[gmail-callback] no Supabase session on this request — redirecting to /login");
    return NextResponse.redirect(new URL("/login", origin));
  }

  if (oauthError) {
    console.log("[gmail-callback] Google returned an OAuth error param — redirecting with error:", oauthError);
    return redirectWithError(origin, oauthError);
  }

  const cookieHeader = request.headers.get("cookie");
  const expectedState = cookieHeader
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1];

  console.log("[gmail-callback] state check:", {
    stateFromGoogle: state,
    stateFromCookie: expectedState ?? null,
    cookieHeaderPresent: Boolean(cookieHeader),
    match: Boolean(state && expectedState && state === expectedState),
  });

  if (!code || !state || !expectedState || state !== expectedState) {
    console.log("[gmail-callback] FAILED at state/code validation — redirecting with error: invalid_state", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      hasExpectedState: Boolean(expectedState),
    });
    return redirectWithError(origin, "invalid_state");
  }

  console.log("[gmail-callback] state validated OK — proceeding to token exchange");

  try {
    console.log("[gmail-callback] calling exchangeCodeForTokens()...");
    const tokens = await exchangeCodeForTokens(code);
    console.log("[gmail-callback] exchangeCodeForTokens() returned:", {
      hasAccessToken: Boolean(tokens.accessToken),
      accessTokenLength: tokens.accessToken?.length ?? 0,
      hasRefreshToken: Boolean(tokens.refreshToken),
      refreshTokenLength: tokens.refreshToken?.length ?? 0,
      expiresIn: tokens.expiresIn,
    });

    if (!tokens.refreshToken) {
      // Can happen if the user previously connected and this consent
      // didn't re-prompt for some reason — access_type=offline +
      // prompt=consent should prevent this, but fail clearly rather
      // than silently storing a token that can't be refreshed later.
      console.log("[gmail-callback] FAILED — no refresh_token in Google's response");
      throw new Error("Google didn't return a refresh token — try disconnecting and reconnecting");
    }

    console.log("[gmail-callback] calling fetchConnectedEmail()...");
    const email = await fetchConnectedEmail(tokens.accessToken);
    console.log("[gmail-callback] fetchConnectedEmail() returned:", email);

    const tokenExpiry = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();
    console.log("[gmail-callback] computed token_expiry:", tokenExpiry);

    console.log("[gmail-callback] encrypting tokens before storage...");
    const encryptedAccessToken = encrypt(tokens.accessToken);
    const encryptedRefreshToken = encrypt(tokens.refreshToken);
    console.log("[gmail-callback] encryption OK:", {
      encryptedAccessTokenLength: encryptedAccessToken.length,
      encryptedRefreshTokenLength: encryptedRefreshToken.length,
    });

    console.log("[gmail-callback] upserting into oauth_tokens for user:", user.id);
    const { error: upsertError, data: upsertData } = await supabase
      .from("oauth_tokens")
      .upsert(
        {
          user_id: user.id,
          provider: "gmail",
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: tokenExpiry,
          email,
        },
        { onConflict: "user_id,provider" }
      )
      .select("id, user_id, provider, email, token_expiry");

    console.log("[gmail-callback] oauth_tokens upsert result:", {
      upsertError: upsertError
        ? { message: upsertError.message, details: upsertError.details, hint: upsertError.hint, code: upsertError.code }
        : null,
      upsertData,
    });

    if (upsertError) {
      console.error("[gmail-callback] FAILED at oauth_tokens upsert:", upsertError.message);
      console.error("[email] failed to store Gmail tokens:", upsertError.message);
      return redirectWithError(origin, "storage_failed");
    }

    console.log("[gmail-callback] logging agent_activities row...");
    const { error: activityError } = await supabase.from("agent_activities").insert({
      user_id: user.id,
      agent_name: "email_agent",
      action: `Connected Gmail (${email})`,
      status: "success",
    });
    if (activityError) {
      console.log("[gmail-callback] agent_activities insert failed (non-fatal):", activityError.message);
    }

    console.log("[gmail-callback] SUCCESS — redirecting to /dashboard/email?connected=1");
    const response = NextResponse.redirect(new URL("/dashboard/email?connected=1", origin));
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (err) {
    console.error("[gmail-callback] FAILED — exception thrown:", err);
    console.error(
      "[gmail-callback] exception message:",
      err instanceof Error ? err.message : String(err)
    );
    console.error(
      "[gmail-callback] exception stack:",
      err instanceof Error ? err.stack : "(no stack — not an Error instance)"
    );
    console.error("[email] Gmail connect failed:", err instanceof Error ? err.message : err);
    return redirectWithError(origin, "connect_failed");
  }
}
