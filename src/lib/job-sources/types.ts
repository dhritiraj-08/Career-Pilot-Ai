/**
 * Common shape both job sources (RemoteOK, WeWorkRemotely) normalize
 * into before being upserted into `job_listings`. Keeping this in one
 * place means the API route and the upsert logic never need to know
 * which source a job came from.
 */
export interface NormalizedJob {
  source: "remoteok" | "weworkremotely";
  external_id: string;
  title: string;
  company: string;
  location: string | null;
  job_type: "full_time" | "part_time" | "internship" | "contract" | "freelance" | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  description: string | null;
  /**
   * Skill/technology keywords for this job, lowercased. RemoteOK supplies
   * real tags; WeWorkRemotely has no structured equivalent so this comes
   * back empty — matching falls back to scanning the description text
   * for that source (see lib/job-matching.ts).
   */
  requirements: string[];
  apply_url: string | null;
  posted_at: string | null; // ISO 8601, or null if unknown
}
