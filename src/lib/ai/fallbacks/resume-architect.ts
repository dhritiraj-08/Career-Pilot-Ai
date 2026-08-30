import type { CandidateContext } from "@/lib/ai/prompts/resume-architect";
import type { ParsedAnalysis, Recommendation } from "@/lib/validations/resume-architect";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "have",
  "this", "that", "from", "must", "able", "who", "what", "when", "where",
  "who's", "into", "such", "than", "them", "they", "their", "were", "was",
  "role", "job", "work", "team", "years", "year", "experience", "strong",
  "good", "excellent", "including", "etc", "using", "use", "used",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9+.#-]{1,}/g) ?? []).filter(
    (word) => word.length > 2 && !STOPWORDS.has(word)
  );
}

/** Frequency-ranked distinct tokens from the job description, used as a
 * crude proxy for "important terms" when there's no LLM to identify
 * real keywords semantically. */
function extractCandidateKeywords(jobDescription: string, limit = 20): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(jobDescription)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Deterministic fallback for the analysis phase: real keyword-overlap
 * heuristics (not fabricated data) computed directly from the resume
 * text, job description, and stored profile — used only if the
 * analysis LLM call fails or its JSON can't be salvaged.
 */
export function fallbackAnalysis(ctx: CandidateContext): ParsedAnalysis {
  const resumeLower = ctx.resumeText.toLowerCase();
  const candidateKeywords = extractCandidateKeywords(ctx.jobDescription);

  const keywordsFound = candidateKeywords.filter((kw) => resumeLower.includes(kw));
  const keywordsMissing = candidateKeywords.filter((kw) => !resumeLower.includes(kw));
  const keywordsMatch =
    candidateKeywords.length > 0 ? Math.round((keywordsFound.length / candidateKeywords.length) * 100) : 50;

  const skillsOnResume = ctx.skills.filter((skill) => resumeLower.includes(skill.toLowerCase()));
  const skillsMatch =
    ctx.skills.length > 0 ? Math.round((skillsOnResume.length / ctx.skills.length) * 100) : 40;

  // Genuinely can't assess "match to this job's experience requirements"
  // without NLP the fallback doesn't have — these are honest, coarse
  // proxies (has experience at all / has education on file at all),
  // not a claim of real requirement-matching.
  const experienceMatch = ctx.yearsExperience > 0 ? 60 : 35;
  const educationMatch = ctx.education.length > 0 ? 65 : 35;

  const atsScore = Math.round((skillsMatch + experienceMatch + keywordsMatch + educationMatch) / 4);

  const strengths: string[] = [];
  if (skillsOnResume.length > 0) {
    strengths.push(`Your resume includes ${skillsOnResume.length} of your listed skills: ${skillsOnResume.slice(0, 5).join(", ")}.`);
  }
  if (ctx.yearsExperience > 0) {
    strengths.push(`You have ${ctx.yearsExperience} year${ctx.yearsExperience === 1 ? "" : "s"} of experience on file.`);
  }
  if (strengths.length === 0) {
    strengths.push("Your resume is saved and ready for review.");
  }

  const weaknesses: string[] = [];
  if (keywordsMissing.length > 0) {
    weaknesses.push(`Several terms from the job description don't appear in your resume: ${keywordsMissing.slice(0, 5).join(", ")}.`);
  }
  if (ctx.education.length === 0) {
    weaknesses.push("No education history is on file.");
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Couldn't identify specific gaps automatically — try again shortly for a full AI review.");
  }

  const recommendations: Recommendation[] = [];
  if (keywordsMissing.length > 0) {
    recommendations.push({
      text: `Consider adding these job-relevant terms if they genuinely apply to you: ${keywordsMissing.slice(0, 6).join(", ")}.`,
      priority: "high",
    });
  }
  recommendations.push({
    text: "Quantify your achievements with real numbers (e.g. team size, percentage improvement, revenue impact) where possible.",
    priority: "medium",
  });
  recommendations.push({
    text: "This is a basic automated check — re-run Analyze & Generate for a full AI-written review and tailored documents.",
    priority: "low",
  });

  return {
    atsScore,
    scoreBreakdown: {
      skills_match: skillsMatch,
      experience_match: experienceMatch,
      keywords_match: keywordsMatch,
      education_match: educationMatch,
    },
    keywordsFound,
    keywordsMissing,
    strengths,
    weaknesses,
    recommendations,
  };
}

const FALLBACK_NOTICE =
  "[AI tailoring is temporarily unavailable, so this is your original resume content rather than an AI-optimized rewrite. Please try Analyze & Generate again shortly.]\n\n";

/** Honest degraded output: the real original resume text, clearly
 * labeled as not AI-tailored — never a fabricated "tailored" rewrite. */
export function fallbackTailoredResume(ctx: CandidateContext): string {
  return FALLBACK_NOTICE + ctx.resumeText;
}

const COVER_LETTER_NOTICE =
  "[AI writing is temporarily unavailable, so this is a basic template filled with your profile details rather than an AI-written letter. Please try Analyze & Generate again shortly.]\n\n";

/** A real, non-fabricated template built only from data actually on
 * file (name, role, target role) — not an attempt to fake AI prose. */
export function fallbackCoverLetter(ctx: CandidateContext): string {
  const greeting = "Dear Hiring Manager,";
  const intro = `I am writing to express my interest in the ${ctx.targetRole} position.${
    ctx.currentJobRole
      ? ` I currently work as a ${ctx.currentJobRole}${ctx.currentCompany ? ` at ${ctx.currentCompany}` : ""}, and I am excited about the opportunity to bring my experience to this role.`
      : ""
  }`;
  const skillsLine =
    ctx.skills.length > 0
      ? `My background includes experience with ${ctx.skills.slice(0, 6).join(", ")}, which I believe aligns well with what you're looking for.`
      : "I bring a strong foundation of relevant skills and a genuine enthusiasm for this field.";
  const closing = `Thank you for considering my application. I would welcome the opportunity to discuss how my background can contribute to your team.\n\nSincerely,\n${ctx.fullName || "Your name"}`;

  return `${COVER_LETTER_NOTICE}${greeting}\n\n${intro}\n\n${skillsLine}\n\n${closing}`;
}
