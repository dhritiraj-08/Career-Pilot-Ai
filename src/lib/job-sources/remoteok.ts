import "server-only";

import type { NormalizedJob } from "./types";

const REMOTEOK_API_URL = "https://remoteok.com/api";
const FETCH_TIMEOUT_MS = 12_000;

/** Raw shape is loosely typed on purpose — RemoteOK has no public schema
 * doc and field presence varies row to row (salary fields, location,
 * even description are all sometimes missing). Everything below is read
 * defensively rather than assumed. */
interface RawRemoteOkJob {
  id?: string | number;
  slug?: string;
  company?: string;
  position?: string;
  tags?: string[];
  location?: string;
  salary_min?: number | string;
  salary_max?: number | string;
  description?: string;
  apply_url?: string;
  url?: string;
  date?: string;
  epoch?: number;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

// RemoteOK's raw JSON carries literal HTML entities not just in
// `description` but in plain text fields too (`company`, `position`,
// `location` have shown up as e.g. "Localiza&amp;Co") — decoding is
// applied everywhere text is displayed, not just the HTML description.
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function toIsoDate(job: RawRemoteOkJob): string | null {
  if (job.date) {
    const d = new Date(job.date);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (typeof job.epoch === "number") {
    const d = new Date(job.epoch * 1000);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

/**
 * Fetches and normalizes live listings from the RemoteOK public API.
 * No API key required, but RemoteOK returns a Cloudflare block page
 * (not JSON) to requests without a real-looking User-Agent, so one is
 * always set below.
 *
 * Never throws — a scrape failure here should not take down the other
 * source. Returns [] and logs on any error.
 */
export async function fetchRemoteOkJobs(): Promise<NormalizedJob[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(REMOTEOK_API_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CareerPilotAI-JobHunter/1.0; +https://careerpilot.ai)",
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[job-hunter] RemoteOK responded ${response.status}`);
      return [];
    }

    const data = await response.json().catch(() => null);
    if (!Array.isArray(data)) {
      console.error("[job-hunter] RemoteOK response was not an array");
      return [];
    }

    // The first element is always a legal/notice object, not a job —
    // filter by requiring an id + position rather than assuming index 0.
    const jobs = data as RawRemoteOkJob[];

    return jobs
      .filter((job) => job.id != null && job.position && job.company)
      .map((job): NormalizedJob => {
        const tags = Array.isArray(job.tags) ? job.tags.map((t) => t.toLowerCase().trim()) : [];
        return {
          source: "remoteok",
          external_id: String(job.id),
          title: decodeEntities(job.position!.trim()),
          company: decodeEntities(job.company!.trim()),
          location: job.location?.trim() ? decodeEntities(job.location.trim()) : "Remote (Worldwide)",
          job_type: "full_time",
          salary_min: toNumber(job.salary_min),
          salary_max: toNumber(job.salary_max),
          currency: "USD",
          description: job.description ? stripHtml(job.description) : null,
          requirements: tags,
          apply_url: job.apply_url || job.url || (job.slug ? `https://remoteok.com/remote-jobs/${job.slug}` : null),
          posted_at: toIsoDate(job),
        };
      });
  } catch (err) {
    console.error("[job-hunter] RemoteOK fetch failed:", err instanceof Error ? err.message : err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
