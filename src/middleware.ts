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
  // whether they've completed onboarding — the same new-vs-existing
  // check used right after OTP verification and in the auth callback —
  // so a fresh sign-up doesn't get dropped on an empty dashboard.
  if (AUTH_ENTRY_PATHS.includes(pathname) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.redirect(
      new URL(profile ? "/dashboard" : "/onboarding", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
