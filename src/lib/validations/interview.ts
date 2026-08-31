import { z } from "zod";

export const INTERVIEW_TYPES = ["technical", "hr", "mixed"] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const QUESTION_COUNTS = [5, 10, 15] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

// Schema's interview_questions.question_type check constraint —
// 'aptitude' exists in the DB but this agent never generates it; kept
// out of the LLM-facing type since "Technical / HR / Mixed" (the
// selection this page actually offers) only ever needs these two.
export const QUESTION_TYPES = ["technical", "behavioral", "hr"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface InterviewQuestionItem {
  id: string;
  question: string;
  type: QuestionType;
  orderIndex: number;
}

// ---------------------------------------------------------------------
// Question generation (POST /start)
// ---------------------------------------------------------------------
const rawQuestionSchema = z.object({
  question: z.string().trim().min(1),
  type: z.enum(QUESTION_TYPES).catch("technical"),
});

const rawQuestionSetSchema = z.object({
  questions: z.array(rawQuestionSchema).nullable().optional(),
});

export function parseGeneratedQuestions(raw: unknown, expectedCount: number): { question: string; type: QuestionType }[] {
  const parsed = rawQuestionSetSchema.safeParse(raw);
  const questions = parsed.success ? parsed.data.questions ?? [] : [];
  return questions.slice(0, expectedCount);
}

// ---------------------------------------------------------------------
// Answer evaluation (POST /answer)
// ---------------------------------------------------------------------
const clampScore = (n: unknown): number => {
  const num = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
};

const rawAnswerEvalSchema = z.object({
  score: z.number().nullable().optional(),
  feedback: z.string().nullable().optional(),
});

export interface AnswerEvaluation {
  score: number;
  feedback: string;
}

export function parseAnswerEvaluation(raw: unknown): AnswerEvaluation {
  const parsed = rawAnswerEvalSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};
  return {
    score: clampScore(data.score),
    feedback: data.feedback?.trim() || "No feedback available for this answer.",
  };
}

// ---------------------------------------------------------------------
// Session summary (final wrap-up after the last answer)
//
// interview_sessions has technical_score / communication_score /
// aptitude_score columns (no dedicated "confidence" column exists, and
// adding one means a migration that may never get run against a live
// database — see docs/schema.sql history). This agent uses
// aptitude_score to store the confidence score; API responses and the
// UI both surface it labeled "Confidence" so the mapping is invisible
// to the user, and it's called out here and in the API route so a
// future reader isn't confused by the name mismatch.
// ---------------------------------------------------------------------
const rawSummarySchema = z.object({
  overall_score: z.number().nullable().optional(),
  technical_score: z.number().nullable().optional(),
  communication_score: z.number().nullable().optional(),
  confidence_score: z.number().nullable().optional(),
  strengths: z.array(z.string()).nullable().optional(),
  weaknesses: z.array(z.string()).nullable().optional(),
  recommendations: z.array(z.string()).nullable().optional(),
  summary: z.string().nullable().optional(),
});

export interface SessionSummary {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
}

export function parseSessionSummary(raw: unknown): SessionSummary {
  const parsed = rawSummarySchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  const technicalScore = clampScore(data.technical_score);
  const communicationScore = clampScore(data.communication_score);
  const confidenceScore = clampScore(data.confidence_score);
  const overallFromModel = data.overall_score != null ? clampScore(data.overall_score) : null;
  const overallComputed = Math.round((technicalScore + communicationScore + confidenceScore) / 3);

  return {
    overallScore: overallFromModel ?? overallComputed,
    technicalScore,
    communicationScore,
    confidenceScore,
    strengths: data.strengths ?? [],
    weaknesses: data.weaknesses ?? [],
    recommendations: data.recommendations ?? [],
    summary: data.summary?.trim() || "",
  };
}

// feedback_summary is a plain `text` column — no jsonb, no room for
// separate strengths/weaknesses/recommendations columns without a
// migration. The whole SessionSummary (minus the scores, which have
// their own columns) is JSON-stringified into it and parsed back out
// on read, the same pattern already used for `recommendations` in
// resumes analyses (see lib/validations/resume-architect.ts).
export function encodeFeedbackSummary(summary: SessionSummary): string {
  return JSON.stringify({
    strengths: summary.strengths,
    weaknesses: summary.weaknesses,
    recommendations: summary.recommendations,
    summary: summary.summary,
  });
}

export interface DecodedFeedbackSummary {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
}

export function decodeFeedbackSummary(raw: string | null): DecodedFeedbackSummary {
  const empty: DecodedFeedbackSummary = { strengths: [], weaknesses: [], recommendations: [], summary: "" };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw);
    return {
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch {
    // Pre-existing plain-text feedback_summary (shouldn't happen for
    // rows this agent writes, but don't crash on it either).
    return { ...empty, summary: raw };
  }
}
