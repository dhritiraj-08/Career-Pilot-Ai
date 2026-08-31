import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRemoteOkJobs } from "@/lib/job-sources/remoteok";
import { fetchWeWorkRemotelyJobs } from "@/lib/job-sources/weworkremotely";
import type { NormalizedJob } from "@/lib/job-sources/types";
import { scoreJob, type CandidateSearchCriteria } from "@/lib/job-matching";

interface RequestBody {
  workModes?: string[];
  location?: string;
  role?: string;
  minSalary?: number | null;
  indiaFriendlyOnly?: boolean;
}

const VALID_WORK_MODES = new Set(["remote", "hybrid", "onsite"]);

export interface JobHunterResultItem {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  jobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  description: string | null;
  applyUrl: string | null;
  postedAt: string | null;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchReasons: string[];
  regionRestriction: string | null;
  applicationStatus: "saved" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn" | null;
}

// Both live scrapers can each take a few seconds; give the whole
// request room without the platform's default cutting it short.
export const maxDuration = 60;

/**
 * Runs the Job Hunter agent: pulls live listings from RemoteOK + WWR,
 * upserts them into the shared job_listings catalog, scores each one
 * against the caller's profile/preferences (blended with whatever this
 * particular search's filters say), and returns them ranked best-first.
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

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const workModes = (body?.workModes ?? []).filter((m): m is "remote" | "hybrid" | "onsite" =>
    VALID_WORK_MODES.has(m)
  );
  const location = body?.location?.trim() ?? "";
  const role = body?.role?.trim() ?? "";
  const minSalary = typeof body?.minSalary === "number" && body.minSalary > 0 ? body.minSalary : null;
  const indiaFriendlyOnly = body?.indiaFriendlyOnly === true;

  // Both sources are remote-only. If the user asked for onsite alone
  // (no remote/hybrid also selected), no listing here can ever satisfy
  // that — an honest empty result, not a bug, and not worth spending a
  // scrape on.
  const onsiteOnly = workModes.length > 0 && !workModes.includes("remote") && !workModes.includes("hybrid");

  const [{ data: profile }, { data: skillRows }, { data: preferences }] = await Promise.all([
    supabase.from("profiles").select("current_job_role").eq("user_id", user.id).maybeSingle(),
    supabase.from("skills").select("name").eq("user_id", user.id),
    supabase
      .from("job_preferences")
      .select("target_roles, preferred_locations, work_mode, min_salary, currency")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const candidateSkills = (skillRows ?? []).map((s) => s.name.toLowerCase().trim());
  const criteria: CandidateSearchCriteria = {
    skills: candidateSkills,
    roles: role ? [role] : preferences?.target_roles ?? [],
    currentJobRole: profile?.current_job_role ?? "",
    workModes: workModes.length > 0 ? workModes : preferences?.work_mode && preferences.work_mode !== "any"
      ? [preferences.work_mode as "remote" | "hybrid" | "onsite"]
      : [],
    location: location || preferences?.preferred_locations?.[0] || "",
    minSalary: minSalary ?? preferences?.min_salary ?? null,
    currency: preferences?.currency ?? "INR",
  };

  if (onsiteOnly) {
    return NextResponse.json({ jobs: [], message: "No jobs found right now, try again later." });
  }

  const [remoteOkResult, wwrResult] = await Promise.allSettled([
    fetchRemoteOkJobs(),
    fetchWeWorkRemotelyJobs(),
  ]);

  const normalizedJobs: NormalizedJob[] = [
    ...(remoteOkResult.status === "fulfilled" ? remoteOkResult.value : []),
    ...(wwrResult.status === "fulfilled" ? wwrResult.value : []),
  ];

  if (remoteOkResult.status === "rejected") {
    console.error("[job-hunter] RemoteOK source rejected:", remoteOkResult.reason);
  }
  if (wwrResult.status === "rejected") {
    console.error("[job-hunter] WeWorkRemotely source rejected:", wwrResult.reason);
  }

  if (normalizedJobs.length === 0) {
    return NextResponse.json({ jobs: [], message: "No jobs found right now, try again later." });
  }

  // Upsert into the shared catalog with the service-role client — regular
  // users have no write policy on job_listings by design (see
  // docs/schema.sql). .select() gets real row ids back for scoring/saving.
  const admin = createAdminClient();
  const { data: upsertedListings, error: upsertError } = await admin
    .from("job_listings")
    .upsert(
      normalizedJobs.map((job) => ({
        source: job.source,
        external_id: job.external_id,
        title: job.title,
        company: job.company,
        location: job.location,
        job_type: job.job_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        currency: job.currency,
        description: job.description,
        requirements: job.requirements,
        apply_url: job.apply_url,
        posted_at: job.posted_at,
        is_active: true,
      })),
      { onConflict: "source,external_id" }
    )
    .select("id, source, external_id");

  if (upsertError || !upsertedListings) {
    console.error("[job-hunter] failed to upsert job_listings:", upsertError?.message);
    return NextResponse.json({ error: "Couldn't save job listings" }, { status: 500 });
  }

  const listingIdByKey = new Map(
    upsertedListings.map((row) => [`${row.source}:${row.external_id}`, row.id as string])
  );

  // Existing application state for these listings, so the client can
  // show accurate Saved/Applied badges without a second round trip.
  const listingIds = Array.from(listingIdByKey.values());
  const { data: existingApplications } = await supabase
    .from("job_applications")
    .select("job_listing_id, status")
    .eq("user_id", user.id)
    .in("job_listing_id", listingIds);

  const statusByListingId = new Map(
    (existingApplications ?? []).map((row) => [row.job_listing_id as string, row.status])
  );

  const results: JobHunterResultItem[] = normalizedJobs
    .map((job): JobHunterResultItem | null => {
      const id = listingIdByKey.get(`${job.source}:${job.external_id}`);
      if (!id) return null;
      const scored = scoreJob(job, criteria);
      return {
        id,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.job_type,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        currency: job.currency,
        description: job.description,
        applyUrl: job.apply_url,
        postedAt: job.posted_at,
        score: scored.score,
        matchedSkills: scored.matchedSkills,
        missingSkills: scored.missingSkills,
        matchReasons: scored.matchReasons,
        regionRestriction: scored.regionRestriction,
        applicationStatus: (statusByListingId.get(id) as JobHunterResultItem["applicationStatus"]) ?? null,
      };
    })
    .filter((r): r is JobHunterResultItem => r !== null)
    .filter((r) => !indiaFriendlyOnly || r.regionRestriction === null)
    .sort((a, b) => b.score - a.score);

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "job_hunter",
    action: `Searched for jobs${role ? ` matching "${role}"` : ""} — found ${results.length} listing${results.length === 1 ? "" : "s"}`,
    status: "success",
    details: { count: results.length, sources: normalizedJobs.map((j) => j.source) },
  });

  return NextResponse.json({ jobs: results });
}
