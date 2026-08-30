import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Refreshes the Supabase auth session on every request and hands back
 * everything root middleware needs to make a routing decision: the
 * (possibly updated) response, the current user (if any), and the
 * Supabase client used to resolve it — reuse `supabase` for any further
 * reads in the same request instead of creating a second client.
 *
 * Server Components can't write cookies, so an expiring session would
 * never get renewed without this running in root middleware. Call
 * `updateSession` from `src/middleware.ts` and return `response`
 * (after any further route-protection logic) so the refreshed session
 * cookie actually reaches the browser.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
  supabase: SupabaseClient;
}> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() (not getSession()) revalidates the token against
  // Supabase Auth on every call, which is what actually triggers a refresh
  // of an expired session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
