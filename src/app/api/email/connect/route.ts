import { NextResponse } from "next/server";
import crypto from "crypto";

import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/gmail";

const STATE_COOKIE = "gmail_oauth_state";

/** Kicks off the Gmail OAuth flow — sets a short-lived random state
 * cookie (checked back against Google's redirect in the callback route
 * as basic CSRF protection) and redirects to Google's consent screen. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  let authUrl: string;
  try {
    const state = crypto.randomBytes(24).toString("hex");
    authUrl = buildAuthUrl(state);
    const response = NextResponse.redirect(authUrl);
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes — plenty for a consent screen round trip
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("[email] couldn't start Gmail connect:", err instanceof Error ? err.message : err);
    const url = new URL("/dashboard/email", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    url.searchParams.set("error", "gmail_not_configured");
    return NextResponse.redirect(url);
  }
}
