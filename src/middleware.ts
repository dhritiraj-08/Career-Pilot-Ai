import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];
const AUTH_ENTRY_PATHS = ["/", "/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user, supabase } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // /dashboard and /onboarding (and everything nested) require a session.
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // / and /login bounce a logged-in user onward. Which page depends on
  // whether they've completed onboarding — the same check used right
  // after OTP verification and in the auth callback. This checks
  // job_preferences rather than profiles: onboarding's Step 1 creates a
  // profiles row immediately (each step saves as you go), so profiles
  // existing would incorrectly count someone who quit after Step 1 as
  // "done." job_preferences is written last, at the final required step.
  if (AUTH_ENTRY_PATHS.includes(pathname) && user) {
    const { data: jobPreferences } = await supabase
      .from("job_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.redirect(
      new URL(jobPreferences ? "/dashboard" : "/onboarding", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
