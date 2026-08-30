import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * Server-only (the `server-only` import makes any accidental client-side
 * import a build-time error). Never call this from a Client Component,
 * a browser-facing API response, or anywhere `SUPABASE_SERVICE_ROLE_KEY`
 * could leak to the browser.
 *
 * Reserved for trusted backend/agent code that must act outside a user's
 * own RLS scope — e.g. the Job Hunter agent writing to the shared
 * `job_listings` table, which has no user-write policy by design
 * (see docs/schema.sql).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
