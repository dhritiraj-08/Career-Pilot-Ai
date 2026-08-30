import { z } from "zod";

export const RECOMMENDATION_PRIORITIES = ["high", "medium", "low"] as const;
export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];

export interface Recommendation {
  text: string;
  priority: RecommendationPriority;
}

export interface ScoreBreakdown {
  skills_match: number;
  experience_match: number;
  keywords_match: number;
  education_match: number;
}

export interface ResumeArchitectResult {
  atsScore: number;
  scoreBreakdown: ScoreBreakdown;
  keywordsFound: string[];
  keywordsMissing: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  tailoredResumeContent: string;
  coverLetterContent: string;
  usedFallback: boolean;
}

// ---------------------------------------------------------------------
// recommendations lives in the DB as `text[]` (schema.sql), not jsonb —
// no room to add a dedicated priority column without violating the
// schema's "columns defined upfront" rule. Each array element is a
// JSON-stringified Recommendation instead, round-tripped through these
// two helpers rather than a bracket-prefix convention (more robust:
// no ambiguity if recommendation text itself starts with something
// bracket-like).
// ---------------------------------------------------------------------
export function encodeRecommendation(rec: Recommendation): string {
  return JSON.stringify(rec);
}

export function decodeRecommendation(raw: string): Recommendation {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.text === "string" &&
      RECOMMENDATION_PRIORITIES.includes(parsed.priority)
    ) {
      return { text: parsed.text, priority: parsed.priority };
    }
  } catch {
    // fall through — treat raw as plain legacy text
  }
  return { text: raw, priority: "medium" };
}

// ---------------------------------------------------------------------
// Lenient parsing of the LLM's analysis JSON — an individual malformed
// field is dropped/defaulted rather than discarding the whole response,
// same approach as lib/validations/resume-parse.ts.
// ---------------------------------------------------------------------
const rawRecommendationSchema = z.object({
  text: z.string().trim().min(1),
  priority: z.enum(RECOMMENDATION_PRIORITIES).catch("medium"),
});

const clampScore = (n: unknown): number => {
  const num = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
};

const rawAnalysisSchema = z.object({
  ats_score: z.number().nullable().optional(),
  score_breakdown: z
    .object({
      skills_match: z.number().nullable().optional(),
      experience_match: z.number().nullable().optional(),
      keywords_match: z.number().nullable().optional(),
      education_match: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  keywords_found: z.array(z.string()).nullable().optional(),
  keywords_missing: z.array(z.string()).nullable().optional(),
  strengths: z.array(z.string()).nullable().optional(),
  weaknesses: z.array(z.string()).nullable().optional(),
  recommendations: z.array(rawRecommendationSchema).nullable().optional(),
});

export interface ParsedAnalysis {
  atsScore: number;
  scoreBreakdown: ScoreBreakdown;
  keywordsFound: string[];
  keywordsMissing: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
}

export function parseAnalysisResponse(raw: unknown): ParsedAnalysis {
  const parsed = rawAnalysisSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  const breakdown: ScoreBreakdown = {
    skills_match: clampScore(data.score_breakdown?.skills_match),
    experience_match: clampScore(data.score_breakdown?.experience_match),
    keywords_match: clampScore(data.score_breakdown?.keywords_match),
    education_match: clampScore(data.score_breakdown?.education_match),
  };

  const overallFromModel = data.ats_score != null ? clampScore(data.ats_score) : null;
  const overallComputed = Math.round(
    (breakdown.skills_match + breakdown.experience_match + breakdown.keywords_match + breakdown.education_match) / 4
  );

  return {
    atsScore: overallFromModel ?? overallComputed,
    scoreBreakdown: breakdown,
    keywordsFound: data.keywords_found ?? [],
    keywordsMissing: data.keywords_missing ?? [],
    strengths: data.strengths ?? [],
    weaknesses: data.weaknesses ?? [],
    recommendations: (data.recommendations ?? []).map((r) => ({ text: r.text, priority: r.priority })),
  };
}
