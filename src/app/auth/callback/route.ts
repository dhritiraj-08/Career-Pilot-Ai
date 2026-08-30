import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles the magic-link fallback: if a user clicks the link in the OTP
 * email instead of typing the 6-digit code, Supabase redirects here with
 * a `code` param. Exchanges it for a session, then routes the same way
 * the typed-code flow does — new user (no profile row yet) → onboarding,
 * existing user → dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
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
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
