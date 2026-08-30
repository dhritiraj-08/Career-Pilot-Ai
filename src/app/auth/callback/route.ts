import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Link-click fallback for the email OTP flow: if a user clicks the link
 * in their code email instead of typing the 6-digit code, this route
 * verifies it and routes the same way the typed-code flow does — new
 * user (no profile row yet) → onboarding, existing user → dashboard.
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      return NextResponse.redirect(
        `${origin}${profile ? "/dashboard" : "/onboarding"}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
