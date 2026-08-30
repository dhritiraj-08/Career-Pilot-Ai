import type { OpenRouterMessage } from "@/lib/ai/openrouter";

const MAX_RESUME_CHARS = 8000;
const MAX_JD_CHARS = 6000;

interface CandidateContext {
  resumeText: string;
  jobDescription: string;
  targetRole: string;
  fullName: string;
  currentJobRole: string;
  currentCompany: string;
  yearsExperience: number;
  skills: string[];
  education: string[];
}

function buildContextBlock(ctx: CandidateContext): string {
  return `TARGET ROLE: ${ctx.targetRole}

JOB DESCRIPTION:
${ctx.jobDescription.slice(0, MAX_JD_CHARS)}

CANDIDATE PROFILE:
- Name: ${ctx.fullName || "Not provided"}
- Current role: ${ctx.currentJobRole || "Not provided"}${ctx.currentCompany ? ` at ${ctx.currentCompany}` : ""}
- Years of experience: ${ctx.yearsExperience}
- Skills on file: ${ctx.skills.length > 0 ? ctx.skills.join(", ") : "None listed"}
- Education: ${ctx.education.length > 0 ? ctx.education.join("; ") : "None listed"}

CANDIDATE'S RESUME (extracted text):
${ctx.resumeText.slice(0, MAX_RESUME_CHARS)}`;
}

export function buildAnalysisMessages(ctx: CandidateContext): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: `You are an ATS (Applicant Tracking System) analysis engine for CareerPilot AI. Compare a candidate's resume against a job description and score the match.

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{
  "ats_score": number (0-100, overall match),
  "score_breakdown": {
    "skills_match": number (0-100),
    "experience_match": number (0-100),
    "keywords_match": number (0-100),
    "education_match": number (0-100)
  },
  "keywords_found": string[] (important terms from the job description that DO appear in the resume),
  "keywords_missing": string[] (important terms from the job description that do NOT appear in the resume),
  "strengths": string[] (2-5 genuine strengths, based only on what's actually in the resume),
  "weaknesses": string[] (2-5 genuine gaps versus the job description),
  "recommendations": [{ "text": string, "priority": "high" | "medium" | "low" }] (3-6 specific, actionable improvements)
}

Rules:
- Base every claim ONLY on the actual resume text and profile data provided — never invent skills, experience, or achievements the candidate doesn't have.
- Keywords should be concrete terms (technologies, certifications, methodologies) from the job description, not generic words.
- Prioritize recommendations that would most improve the ATS match for THIS specific job.`,
    },
    {
      role: "user",
      content: buildContextBlock(ctx),
    },
  ];
}

export function buildTailoredResumeMessages(ctx: CandidateContext): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: `You are a professional resume writer for CareerPilot AI. Rewrite the candidate's resume to be optimized for the target role and job description, emphasizing relevant skills and experience, using strong action verbs.

Critical rule: do NOT invent employers, job titles, dates, degrees, or achievements that are not present in the candidate's original resume. Only rephrase, reorganize, and emphasize real content — fabricating resume content would be dishonest and could constitute resume fraud if the candidate submits it unknowingly.

Output the tailored resume as clean, ready-to-read plain text (use blank lines between sections, plain dashes for bullets) — no markdown syntax (no #, **, etc.), no commentary before or after.`,
    },
    {
      role: "user",
      content: buildContextBlock(ctx),
    },
  ];
}

export function buildCoverLetterMessages(ctx: CandidateContext): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: `You are a professional cover letter writer for CareerPilot AI. Write a concise, professional cover letter (3-4 paragraphs) for the candidate applying to the target role, connecting their real skills and experience to the job description's requirements.

Critical rule: do NOT invent specific achievements, employers, or facts not present in the candidate's actual background. If the hiring company's name isn't given in the job description, open generically (e.g. "Dear Hiring Manager") rather than inventing a placeholder.

Output as clean, ready-to-send plain text — no markdown syntax, no commentary, no bracketed placeholders like [Company Name].`,
    },
    {
      role: "user",
      content: buildContextBlock(ctx),
    },
  ];
}

export type { CandidateContext };
