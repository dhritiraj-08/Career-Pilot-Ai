import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Link-click fallback for the email OTP flow: if a user clicks the link
 * in their code email instead of typing the 6-digit code, this route
 * verifies it and routes the same way the typed-code flow does — no
 * job_preferences row yet → onboarding, otherwise → dashboard.
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
    verified = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  }

  if (verified) {
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
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
