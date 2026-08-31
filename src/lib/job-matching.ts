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
  /** Human-readable region restriction found in the job's own location
   * text (e.g. "North America only"), or null if none was detected. See
   * getRegionRestriction() — this is what drives both the location
   * sub-score and the india-friendly filter. */
  regionRestriction: string | null;
  breakdown: {
    skills: number;
    role: number;
    location: number;
    salary: number;
  };
}

// ---------------------------------------------------------------------
// Region restriction (India-friendly filter)
// ---------------------------------------------------------------------

// WeWorkRemotely in particular routinely restricts "remote" listings to
// a specific region (its <region> field), which RemoteOK/WWR being
// "remote" says nothing about — a listing can be 100% remote and still
// exclude India entirely. These are the phrasings actually observed
// from WWR's region field and RemoteOK's location field; matched
// case-insensitively against the raw text, not a fixed enum, since
// neither source documents a closed set of values.
const EXCLUSIVE_REGION_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bnorth america\b/i, label: "North America only" },
  { pattern: /\bus\s*(\/|,|\band\b|\bor\b)\s*canada\b/i, label: "US/Canada only" },
  { pattern: /\b(u\.?s\.?a?)\s*(\bonly\b|\btimezone)/i, label: "US only" },
  { pattern: /\bcanada\s*only\b/i, label: "Canada only" },
  { pattern: /\b(uk|united kingdom)\s*only\b/i, label: "UK only" },
  { pattern: /\beurope(an union)?\s*only\b/i, label: "Europe only" },
  { pattern: /\bemea\s*only\b/i, label: "EMEA only" },
  { pattern: /\blatam\b|\blatin america\s*only\b/i, label: "LatAm only" },
  { pattern: /\bapac\s*only\b/i, label: "APAC only" },
  { pattern: /\baustralia\s*only\b/i, label: "Australia only" },
];

/**
 * Looks for an explicit region restriction in a job's own location text
 * that would exclude an India-based candidate. Deliberately conservative:
 * only known, explicit "X only" / region-name phrasings count — a job
 * with an empty, vague, or "Worldwide"/"Anywhere" location is treated as
 * unrestricted rather than guessed at either way. If the location
 * mentions India directly, that always wins over any other match (a
 * listing open to "India, US, and Europe" is not exclusionary).
 */
export function getRegionRestriction(location: string | null | undefined): string | null {
  if (!location) return null;
  if (/india/i.test(location)) return null;
  for (const { pattern, label } of EXCLUSIVE_REGION_PATTERNS) {
    if (pattern.test(location)) return label;
  }
  return null;
}

export function isIndiaFriendly(location: string | null | undefined): boolean {
  return getRegionRestriction(location) === null;
}

// ---------------------------------------------------------------------
// Tech-relevance filter
//
// RemoteOK's public /api returns listings from every category it has —
// not just software/tech (confirmed live: postings like "MOT Tester",
// "Shunter", "Handyperson", "Residential Valuer" come back from the same
// endpoint, some carrying RemoteOK's own literal "non tech" tag).
// WeWorkRemotely's programming-category feed is mostly on-topic but not
// perfectly curated either (it has surfaced things like "Counsel,
// Product & Regulatory" and "Manager, Government Compliance"). Neither
// of those is a scoring problem — they're not tech jobs at all, and no
// amount of skill/role scoring should be dressing them up as a match.
// ---------------------------------------------------------------------

// RemoteOK tag vocabulary is free-form, but these show up consistently
// on genuinely technical postings. Used as a positive signal, not an
// exhaustive list — a job with no recognized tag either way falls back
// to the title-based check below rather than being excluded on tag
// absence alone.
const TECH_TAGS = new Set([
  "dev", "developer", "development", "engineer", "engineering", "backend", "back-end",
  "frontend", "front-end", "full stack", "fullstack", "software", "programming",
  "javascript", "typescript", "python", "java", "golang", "go", "rust", "php", "ruby",
  "swift", "kotlin", "c++", "c#", ".net", "sql", "nosql", "database", "devops", "sre",
  "cloud", "aws", "azure", "gcp", "kubernetes", "docker", "sys admin", "sysadmin",
  "security", "infosec", "cyber security", "qa", "testing", "data", "data science",
  "machine learning", "ai", "ml", "nlp", "computer vision", "api", "mobile", "ios",
  "android", "web", "architecture", "architect", "cto", "technical", "ux", "ui",
  "product design", "blockchain", "web3", "game dev", "embedded",
]);

// Title-based backstop, mainly for WeWorkRemotely (no tags at all) and
// for RemoteOK jobs whose tags don't clearly say either way. Deliberately
// specific phrases rather than bare words like "manager" or "tester" —
// "Engineering Manager, AI" and "QA Engineer" must never be caught by
// this, so generic role words are excluded unless combined with a
// clearly non-technical qualifier.
const NON_TECH_TITLE_PATTERNS: RegExp[] = [
  /\bmot tester\b/i, /\bpat tester\b/i, /\bshunter\b/i, /\bhandyperson\b/i, /\bhandyman\b/i,
  /\bcourier\b/i, /\bvaluer\b/i, /\b(store|retail|shift) clerk\b/i, /\bcdp\b/i,
  /\benglish teacher\b/i, /\blegal counsel\b/i, /\bgovernment compliance\b/i,
  /\brecruiter\b/i, /\bcustomer (service|support) (agent|rep)/i, /\bstore manager\b/i,
  /\bvisual merchandiser\b/i, /\bmaintenance technician\b/i, /\bsales manager\b/i,
  /\bmeat and seafood\b/i, /\bresidential valuer\b/i, /\bhotel\b/i, /\bresort\b/i,
  /\bstore person\b/i, /\bparcel delivery\b/i, /\bdelivery driver\b/i, /\bpost office\b/i,
  /\b(governance|risk and compliance|regulatory) analyst\b/i,
  // WeWorkRemotely house filler/promo entries mixed into every category
  // feed — not real job postings at all. The apostrophe in the raw feed
  // has shown up mangled into up to three garbage characters (verified:
  // "Don" + \xE2\x80\x99 misdecoded stacks into "â" + U+0080 + U+0099 +
  // "t") — a genuine encoding issue in the feed itself, not something
  // worth reverse-engineering, but this phrase is distinctive enough
  // that matching a short run of any characters in its place is safe.
  /don.{0,4}t see (a |your )?role/i,
  // A recurring pattern of course/training-program ads (not employment
  // listings) that have shown up riding along in the same feed.
  /\b(course|curriculum) (director|writer|editor|designer)\b/i,
];

/**
 * Whether a job looks like a software/tech role at all, independent of
 * how well it matches this candidate. False excludes it from results
 * entirely (see api/agents/job-hunter/route.ts) — this is a category
 * check, not a relevance score, so "Store Manager" doesn't belong in a
 * tech job search no matter how the scoring shakes out.
 */
export function isLikelyTechJob(job: NormalizedJob): boolean {
  // Real job titles are essentially never this short — a handful of
  // WeWorkRemotely entries have come back as bare fragments ("N A",
  // "GA", "LEGO"), most likely from feed noise rather than a genuine
  // posting. Filtered here rather than as a tech-relevance judgment,
  // since these aren't really identifiable as a job at all.
  if (job.title.trim().length < 5) return false;

  // Title-based exclusion is checked first and wins outright.
  // RemoteOK's own tags are demonstrably unreliable — live data has
  // shown a "Post Office Manager" listing tagged "dev" and a
  // "Governance Risk and Compliance Analyst" tagged "engineer"/"cloud".
  // Tag presence alone can't be trusted to override an unambiguous
  // non-tech title.
  if (NON_TECH_TITLE_PATTERNS.some((p) => p.test(job.title))) return false;

  // WeWorkRemotely never has tags (structural for that source, not a
  // signal), but a genuine RemoteOK tech posting almost always carries
  // several — real listings observed all session have 5-15. A RemoteOK
  // job with literally zero tags is the anomaly, and in practice that
  // anomaly has consistently been non-English or junk postings (a car
  // detailing ad, a cook's personal listing, a tool-rental role) that
  // the English title blocklist above has no way to catch.
  if (job.source === "remoteok" && job.requirements.length === 0) return false;

  const tagsLower = job.requirements.map((t) => t.toLowerCase());
  if (tagsLower.includes("non tech")) return false;
  if (tagsLower.some((t) => TECH_TAGS.has(t))) return true;

  // No tags, or tags present but none recognized either way (RemoteOK's
  // tag vocabulary is inconsistent) — default to including it rather
  // than excluding on missing/ambiguous data.
  return true;
}

// ---------------------------------------------------------------------
// AI/ML role-family relevance
// ---------------------------------------------------------------------

const AI_ML_ROLE_PATTERN = /\b(ai|ml|machine learning|artificial intelligence|data scientist|data science|llm|nlp|deep learning|computer vision)\b/i;
const AI_ML_JOB_SIGNAL = /\b(ai|ml|machine learning|artificial intelligence|data scien\w*|llm|nlp|deep learning|computer vision|neural network|generative ai|genai|large language model)\b/i;
const SOFTWARE_ENGINEERING_SIGNAL = /\b(software engineer|developer|backend|front[- ]?end|full[- ]?stack|programmer|platform engineer|devops|infrastructure engineer|swe)\b/i;

/** True when the candidate is specifically searching for an AI/ML-family
 * role (their target role or current role names it), per the request:
 * "if user target role is AI Engineer or ML Engineer, only show jobs
 * related to AI, ML, LLM, data science, or software engineering." */
function isAiMlRoleFamily(roles: string[], currentJobRole: string): boolean {
  return [...roles, currentJobRole].some((r) => AI_ML_ROLE_PATTERN.test(r));
}

const WORD_SPLIT = /[^a-z0-9+#.]+/;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(WORD_SPLIT)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** Escapes a skill name for use inside a RegExp, so names containing
 * regex-special characters (c++, c#, node.js) don't throw or match the
 * wrong thing. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolves the skill keywords a job is *explicitly* looking for.
 * RemoteOK jobs carry real `requirements` tags — used as-is. WeWorkRemotely
 * doesn't have anything structured, so there is no real "job requires
 * these skills" list to return for it; see scoreSkills() for how that
 * source is scored instead.
 */
function resolveJobSkills(job: NormalizedJob): string[] {
  return job.requirements;
}

/**
 * Finds which of the candidate's own skills are mentioned in free text,
 * using word-boundary matching (not substring) so short skill names like
 * "git" or "sql" don't false-positive inside unrelated words ("digital",
 * "results"). This is evidence of relevance, never a claim about what
 * the job actually requires — WeWorkRemotely gives us no requirement
 * list to compare against, so honesty here means reporting hits, not
 * fabricating a completion percentage.
 */
function findMentionedSkills(text: string, candidateSkills: string[]): string[] {
  const lower = text.toLowerCase();
  return candidateSkills.filter((skill) => {
    if (!skill) return false;
    return new RegExp(`\\b${escapeRegExp(skill)}\\b`, "i").test(lower);
  });
}

function scoreSkills(
  job: NormalizedJob,
  candidateSkills: string[]
): { score: number; matched: string[]; missing: string[]; hadStructuredRequirements: boolean } {
  const jobSkills = resolveJobSkills(job);

  if (jobSkills.length > 0) {
    // Real requirement list (RemoteOK) — a genuine coverage percentage.
    const candidateSet = new Set(candidateSkills);
    const matched = jobSkills.filter((s) => candidateSet.has(s));
    const missing = jobSkills.filter((s) => !candidateSet.has(s));
    return {
      score: Math.round((matched.length / jobSkills.length) * 100),
      matched,
      missing,
      hadStructuredRequirements: true,
    };
  }

  // No requirement list to compare against (WeWorkRemotely). Score on
  // how many distinct candidate skills actually show up in the
  // description, word-boundary matched, on a saturating curve — never
  // 100, because "found N of my own skills mentioned" is not the same
  // claim as "meets 100% of this job's requirements", which we have no
  // way to know for this source.
  const mentioned = job.description ? findMentionedSkills(job.description, candidateSkills) : [];
  const score = mentioned.length === 0 ? 45 : Math.min(45 + mentioned.length * 10, 85);
  return { score, matched: mentioned, missing: [], hadStructuredRequirements: false };
}

function scoreRole(
  job: NormalizedJob,
  roles: string[],
  currentJobRole: string,
  aiMlFamily: boolean
): number {
  const titleTokens = new Set(tokenize(job.title));
  const candidates = [...roles, currentJobRole].filter(Boolean);

  let best = 0;
  if (candidates.length > 0 && titleTokens.size > 0) {
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
  } else {
    best = 50; // no role stated to compare against — neutral, not a floor case
  }

  if (!aiMlFamily) {
    // General case: remote job titles vary a lot in wording for the
    // same actual role, so never fully zero it out.
    return Math.max(best, 30);
  }

  // Candidate is specifically searching for an AI/ML role: a title/role
  // match alone isn't enough signal by itself (a generic "SDE" role
  // string token-matches almost nothing usefully), so this also checks
  // the job's own content for AI/ML or software-engineering signal and
  // uses whichever is higher. Jobs with neither get a much lower floor
  // than the general case — that's the actual "irrelevant industries
  // should score much lower" behavior being asked for.
  const haystack = `${job.title} ${job.description ?? ""}`;
  if (AI_ML_JOB_SIGNAL.test(haystack)) best = Math.max(best, 90);
  else if (SOFTWARE_ENGINEERING_SIGNAL.test(haystack)) best = Math.max(best, 55);
  return Math.max(best, 15);
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

  // A region restriction that excludes India overrides everything else
  // here — a job restricted to "North America only" isn't a better or
  // worse match depending on what location text was typed in, it's
  // simply not available to an India-based candidate.
  if (getRegionRestriction(job.location) !== null) return 5;

  if (!location.trim()) return 70; // no location preference stated — decent default

  const jobLocation = (job.location ?? "").toLowerCase();
  const wanted = location.toLowerCase().trim();

  if (jobLocation.includes("india")) return 100;
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
  const aiMlFamily = isAiMlRoleFamily(criteria.roles, criteria.currentJobRole);

  const skillsResult = scoreSkills(job, criteria.skills);
  const roleScore = scoreRole(job, criteria.roles, criteria.currentJobRole, aiMlFamily);
  const locationScore = scoreLocation(job, criteria.workModes, criteria.location);
  const salaryScore = scoreSalary(job, criteria.minSalary, criteria.currency);

  const composite = Math.round(
    (skillsResult.score + roleScore + locationScore + salaryScore) / 4
  );

  const regionRestriction = getRegionRestriction(job.location);

  const matchReasons: string[] = [];
  if (regionRestriction) {
    matchReasons.push(`This listing is restricted to ${regionRestriction} — likely not open to India-based applicants.`);
  }
  if (skillsResult.hadStructuredRequirements) {
    matchReasons.push(
      `Matches ${skillsResult.matched.length} of ${skillsResult.matched.length + skillsResult.missing.length} skills this role is looking for.`
    );
  } else if (skillsResult.matched.length > 0) {
    matchReasons.push(
      `Mentions ${skillsResult.matched.length} of your skills, but this listing doesn't publish a structured requirements list — treat this as a signal, not a full skill match.`
    );
  } else {
    matchReasons.push("This listing doesn't specify required skills — scored on role and location instead.");
  }
  if (aiMlFamily) {
    if (roleScore >= 85) matchReasons.push("This listing has clear AI/ML signal in its title or description.");
    else if (roleScore <= 20) matchReasons.push("No AI/ML or software engineering signal found for this role search.");
  } else if (roleScore >= 80) {
    matchReasons.push("Job title closely matches your target role.");
  } else if (roleScore >= 50) {
    matchReasons.push("Job title is a partial match for your target role.");
  }
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
    regionRestriction,
    breakdown: {
      skills: skillsResult.score,
      role: roleScore,
      location: locationScore,
      salary: salaryScore,
    },
  };
}
