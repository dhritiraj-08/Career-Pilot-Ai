import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Link-click fallback for the email OTP flow: if a user clicks the link
 * in their code email instead of typing the 6-digit code, this route
 * verifies it and routes the same way the typed-code flow does — no
 * job_preferences row yet → onboarding, otherwise → dashboard. Also
 * handles email/password signup confirmation (type=signup) and password
 * recovery links (type=recovery), which route to /auth/reset-password
 * instead — a recovery token establishes a session, but that session
 * exists to let the user set a new password, not to drop them straight
 * into the dashboard.
 *
 * Handles two link shapes:
 * - `token_hash` + `type` — what Supabase's email templates produce by
 *   default for OTP-style emails (Confirm signup / Magic Link).
 * - `code` — the PKCE param, kept as a fallback for any provider that
 *   redirects here via `exchangeCodeForSession` (e.g. a future OAuth
 *   provider added to this same callback route).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = createClient();
  let verified = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) console.error("[auth/callback] verifyOtp failed:", error.message);
    verified = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    verified = !error;
  } else {
    // Neither param was present — most commonly because the email link
    // came from Supabase's own hosted verify redirect landing back here
    // as a URL fragment (#access_token=...) rather than a query param.
    // Fragments never reach the server. See docs/email-templates.md for
    // the template setup that avoids this entirely.
    console.error(
      "[auth/callback] no token_hash/type or code param on the request:",
      request.url
    );
  }

  if (verified) {
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: jobPreferences } = await supabase
        .from("job_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      return NextResponse.redirect(
        `${origin}${jobPreferences ? "/dashboard" : "/onboarding"}`
      );
    }
    console.error("[auth/callback] verification succeeded but getUser() returned no user");
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
