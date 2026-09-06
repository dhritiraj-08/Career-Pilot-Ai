import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { runJobHunterSearch, type JobHunterSearchParams } from "@/lib/agents/job-hunter";

export type { JobHunterResultItem } from "@/lib/agents/job-hunter";

// Both live scrapers can each take a few seconds; give the whole
// request room without the platform's default cutting it short.
export const maxDuration = 60;

/**
 * Runs the Job Hunter agent: pulls live listings from RemoteOK + WWR,
 * upserts them into the shared job_listings catalog, scores each one
 * against the caller's profile/preferences (blended with whatever this
 * particular search's filters say), and returns them ranked best-first.
 *
 * The actual work lives in lib/agents/job-hunter.ts — the Autopilot
 * orchestrator (api/autopilot/run) calls that same function directly
 * rather than hitting this route over HTTP.
 *
 * No mock data — if both scrapers come back empty, this returns an
 * empty jobs array and the client shows the "try again later" state.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as JobHunterSearchParams | null;
  const result = await runJobHunterSearch(supabase, user.id, body ?? {});

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
