import type { OpenRouterMessage } from "@/lib/ai/openrouter";

const MAX_RESUME_TEXT_CHARS = 12000;

export function buildResumeParseMessages(resumeText: string): OpenRouterMessage[] {
  const truncated = resumeText.slice(0, MAX_RESUME_TEXT_CHARS);

  return [
    {
      role: "system",
      content: `You extract structured profile data from resume text for CareerPilot AI, a career platform for Indian college students and early-career professionals.

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{
  "full_name": string | null,
  "phone": string | null,
  "city": string | null,
  "current_job_role": string | null,
  "current_company": string | null,
  "years_experience": number | null,
  "bio": string | null,
  "skills": [{ "name": string, "level": "beginner" | "intermediate" | "advanced" }],
  "education": [{ "institution": string, "degree": string | null, "field": string | null, "start_year": number | null, "end_year": number | null, "grade": string | null }],
  "linkedin_url": string | null,
  "github_url": string | null,
  "portfolio_url": string | null
}

Rules:
- Use null for anything not present in the text — never invent data.
- "years_experience" is total professional experience in whole years, computed from job date ranges if not stated explicitly; use 0 for students/freshers with no work history.
- "bio" is a 1-2 sentence professional summary in the candidate's own voice, written from the resume content if no summary section exists.
- Infer each skill's level only if the resume gives a clear signal (e.g. years of use, "expert", "familiar with"); default to "intermediate" otherwise.
- Only include a URL field if the exact URL appears in the text.`,
    },
    {
      role: "user",
      content: `Extract the structured profile from this resume text:\n\n${truncated}`,
    },
  ];
}
