import type { NormalizedJob } from "./job-sources/types";

export interface CandidateSearchCriteria {
  /** Lowercased skill names from the user's skills table. */
  skills: string[];
  /** Role(s) this search is scoring against — the search form's role
   * input if the user typed one, otherwise falls back to job_preferences
   * target_roles. */
  roles: string[];
  currentJobRole: string;
  /** Work modes selected in the search form. Empty = no preference. */
  workModes: Array<"remote" | "hybrid" | "onsite">;
  /** Free-text location from the search form, if any. */
  location: string;
  minSalary: number | null;
  /** Currency the min salary above is denominated in — needed because
   * comparing raw numbers across currencies without conversion would be
   * meaningless (e.g. an INR 1,500,000 minimum vs. a USD salary_max). */
  currency: string;
}

export interface JobScore {
  score: number; // 0-100 composite
  matchedSkills: string[];
  missingSkills: string[];
  matchReasons: string[];
  breakdown: {
    skills: number;
    role: number;
    location: number;
    salary: number;
  };
}

const WORD_SPLIT = /[^a-z0-9+#.]+/;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(WORD_SPLIT)
    .map((w) => w.trim())
    .filter(Boolean);
}

/**
 * Resolves the skill keywords a job is looking for. RemoteOK jobs carry
 * real `requirements` tags; WeWorkRemotely doesn't, so for those we scan
 * the description for any of the *candidate's own* skill names — this
 * can only ever find skills the candidate already has, so it never
 * fabricates a "missing skill" out of thin air for that source. It's a
 * narrower signal than RemoteOK's, and that's an honest limitation of
 * the source, not something to paper over.
 */
function resolveJobSkills(job: NormalizedJob, candidateSkills: string[]): string[] {
  if (job.requirements.length > 0) {
    return job.requirements;
  }
  if (!job.description) return [];
  const descLower = job.description.toLowerCase();
  return candidateSkills.filter((skill) => descLower.includes(skill));
}

function scoreSkills(
  jobSkills: string[],
  candidateSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  if (jobSkills.length === 0) {
    // No identifiable skill signal for this job — neutral score rather
    // than penalizing it for a data gap that isn't the candidate's fault.
    return { score: 60, matched: [], missing: [] };
  }
  const candidateSet = new Set(candidateSkills);
  const matched = jobSkills.filter((s) => candidateSet.has(s));
  const missing = jobSkills.filter((s) => !candidateSet.has(s));
  const score = Math.round((matched.length / jobSkills.length) * 100);
  return { score, matched, missing };
}

function scoreRole(job: NormalizedJob, roles: string[], currentJobRole: string): number {
  const titleTokens = new Set(tokenize(job.title));
  const candidates = [...roles, currentJobRole].filter(Boolean);
  if (candidates.length === 0 || titleTokens.size === 0) return 50;

  let best = 0;
  for (const role of candidates) {
    const roleLower = role.toLowerCase().trim();
    if (roleLower && job.title.toLowerCase().includes(roleLower)) {
      best = Math.max(best, 100);
      continue;
    }
    const roleTokens = tokenize(role);
    if (roleTokens.length === 0) continue;
    const overlap = roleTokens.filter((t) => titleTokens.has(t)).length;
    const ratio = overlap / roleTokens.length;
    best = Math.max(best, Math.round(ratio * 80)); // partial overlap tops out below a full phrase match
  }
  // Never fully zero a role out — remote job titles vary a lot in
  // wording for the same actual role, so an unrelated-looking title
  // still gets a low-but-nonzero baseline.
  return Math.max(best, 30);
}

function scoreLocation(
  job: NormalizedJob,
  workModes: Array<"remote" | "hybrid" | "onsite">,
  location: string
): number {
  // Both sources are remote-only listings. If the user asked for onsite
  // specifically (with no remote/hybrid also selected), this job simply
  // cannot satisfy that — callers should hard-filter this case out
  // before scoring (see job-hunter route), but score it honestly here
  // too in case this function is ever called standalone.
  if (workModes.length > 0 && !workModes.includes("remote") && !workModes.includes("hybrid")) {
    return 0;
  }

  if (!location.trim()) return 70; // no location preference stated — decent default

  const jobLocation = (job.location ?? "").toLowerCase();
  const wanted = location.toLowerCase().trim();

  if (!jobLocation) return 50;
  if (jobLocation.includes(wanted)) return 100;
  if (jobLocation.includes("worldwide") || jobLocation.includes("anywhere")) return 80;
  return 40;
}

function scoreSalary(job: NormalizedJob, minSalary: number | null, currency: string): number {
  if (minSalary == null) return 70; // no expectation stated
  if (job.salary_max == null && job.salary_min == null) return 60; // unknown — neutral, not penalized

  // Comparing across currencies without a live FX rate would just be
  // fabricating a number, so an honest neutral score is used instead of
  // guessing when the job's currency doesn't match the stated minimum.
  if (job.currency !== currency) return 55;

  const jobCeiling = job.salary_max ?? job.salary_min ?? 0;
  if (jobCeiling >= minSalary) return 100;
  const ratio = jobCeiling / minSalary;
  return Math.max(Math.round(ratio * 70), 20);
}

export function scoreJob(job: NormalizedJob, criteria: CandidateSearchCriteria): JobScore {
  const jobSkills = resolveJobSkills(job, criteria.skills);
  const skillsResult = scoreSkills(jobSkills, criteria.skills);
  const roleScore = scoreRole(job, criteria.roles, criteria.currentJobRole);
  const locationScore = scoreLocation(job, criteria.workModes, criteria.location);
  const salaryScore = scoreSalary(job, criteria.minSalary, criteria.currency);

  const composite = Math.round(
    (skillsResult.score + roleScore + locationScore + salaryScore) / 4
  );

  const matchReasons: string[] = [];
  if (skillsResult.matched.length > 0) {
    matchReasons.push(
      `Matches ${skillsResult.matched.length} of ${jobSkills.length} skills this role is looking for.`
    );
  } else if (jobSkills.length === 0) {
    matchReasons.push("This listing doesn't specify required skills — scored on role and location instead.");
  }
  if (roleScore >= 80) matchReasons.push("Job title closely matches your target role.");
  else if (roleScore >= 50) matchReasons.push("Job title is a partial match for your target role.");
  if (locationScore >= 80) matchReasons.push("Location fits your preference.");
  if (salaryScore >= 100) matchReasons.push("Salary range meets your minimum.");
  else if (salaryScore <= 55 && criteria.minSalary != null) {
    matchReasons.push("Couldn't confirm salary meets your minimum — verify before applying.");
  }

  return {
    score: composite,
    matchedSkills: skillsResult.matched,
    missingSkills: skillsResult.missing,
    matchReasons,
    breakdown: {
      skills: skillsResult.score,
      role: roleScore,
      location: locationScore,
      salary: salaryScore,
    },
  };
}
