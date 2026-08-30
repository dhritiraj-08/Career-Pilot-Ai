import "server-only";
import { XMLParser } from "fast-xml-parser";

import type { NormalizedJob } from "./types";

const WWR_RSS_URL = "https://weworkremotely.com/categories/remote-programming-jobs.rss";
const FETCH_TIMEOUT_MS = 12_000;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** fast-xml-parser gives back a plain string for a text-only tag but an
 * object ({ "#text": ..., "@_attr": ... }) once the tag carries
 * attributes (WWR's <guid isPermaLink="false">...</guid>) — this
 * normalizes either shape to a plain string. */
function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)["#text"]);
  }
  return "";
}

interface RawWwrItem {
  title?: string;
  link?: string;
  guid?: string | { "#text"?: string };
  pubDate?: string;
  description?: string;
  region?: string;
}

/**
 * Fetches and normalizes live listings from WeWorkRemotely's public RSS
 * feed. No API/key required — RSS is meant for exactly this kind of
 * consumption.
 *
 * Never throws — a scrape failure here should not take down the other
 * source. Returns [] and logs on any error.
 */
export async function fetchWeWorkRemotelyJobs(): Promise<NormalizedJob[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(WWR_RSS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CareerPilotAI-JobHunter/1.0; +https://careerpilot.ai)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[job-hunter] WeWorkRemotely responded ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);

    const rawItems = parsed?.rss?.channel?.item;
    if (!rawItems) {
      console.error("[job-hunter] WeWorkRemotely RSS had no <item> entries");
      return [];
    }
    const items: RawWwrItem[] = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items
      .filter((item) => item.title && item.link)
      .map((item): NormalizedJob => {
        const fullTitle = textOf(item.title);
        // WWR titles follow "Company Name: Job Title" — split on the
        // first colon; if a title has no colon (rare), fall back to
        // treating the whole thing as the title with an unknown company.
        const separatorIndex = fullTitle.indexOf(":");
        const company = separatorIndex > -1 ? fullTitle.slice(0, separatorIndex).trim() : "Unknown";
        const title = separatorIndex > -1 ? fullTitle.slice(separatorIndex + 1).trim() : fullTitle;

        const link = textOf(item.link);
        const guid = textOf(item.guid) || link;
        const pubDate = textOf(item.pubDate);
        const posted_at = pubDate && !Number.isNaN(new Date(pubDate).getTime())
          ? new Date(pubDate).toISOString()
          : null;

        const description = item.description ? stripHtml(textOf(item.description)) : null;

        return {
          source: "weworkremotely",
          external_id: guid,
          title: title || "Untitled role",
          company: company || "Unknown",
          location: textOf(item.region) || "Remote",
          job_type: "full_time",
          salary_min: null,
          salary_max: null,
          currency: "USD",
          description,
          // No structured skill tags on this source — matching falls
          // back to scanning `description` directly (see job-matching.ts).
          requirements: [],
          apply_url: link || null,
          posted_at,
        };
      });
  } catch (err) {
    console.error(
      "[job-hunter] WeWorkRemotely fetch failed:",
      err instanceof Error ? err.message : err
    );
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
