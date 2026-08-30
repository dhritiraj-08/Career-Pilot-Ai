/**
 * Deterministic fallback for when the LLM call fails or its output can't
 * be salvaged: regex extraction of the few fields reliably recoverable
 * from raw text without real understanding. Returns the same raw shape
 * `toOnboardingPrefill` (src/lib/validations/resume-parse.ts) expects,
 * so both the LLM path and this one funnel through one mapper.
 */
export function extractResumeFallback(text: string) {
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{8,}\d)/);
  const linkedinMatch = text.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/https?:\/\/(www\.)?github\.com\/[\w-]+/i);

  // Best-effort name guess: first non-empty line, if it looks name-like
  // (short, letters only, not a section header or contact line).
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  const looksLikeName =
    !!firstLine &&
    firstLine.length <= 60 &&
    /^[A-Za-z][A-Za-z.\s'-]+$/.test(firstLine) &&
    firstLine.split(/\s+/).length <= 5;

  return {
    full_name: looksLikeName ? firstLine! : null,
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    city: null,
    current_job_role: null,
    current_company: null,
    years_experience: null,
    bio: null,
    skills: [],
    education: [],
    linkedin_url: linkedinMatch ? linkedinMatch[0] : null,
    github_url: githubMatch ? githubMatch[0] : null,
    portfolio_url: null,
  };
}
