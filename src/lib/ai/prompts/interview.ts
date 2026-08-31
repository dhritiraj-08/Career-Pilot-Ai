import type { OpenRouterMessage } from "@/lib/ai/openrouter";
import type { InterviewType } from "@/lib/validations/interview";

const MAX_RESUME_CHARS = 6000;
const MAX_JD_CHARS = 4000;
const MAX_ANSWER_CHARS = 3000;

export interface InterviewCandidateContext {
  resumeText: string;
  jobDescription: string;
  targetRole: string;
  fullName: string;
  skills: string[];
}

function contextBlock(ctx: InterviewCandidateContext): string {
  return `TARGET ROLE: ${ctx.targetRole}

JOB DESCRIPTION:
${ctx.jobDescription.slice(0, MAX_JD_CHARS) || "Not provided"}

CANDIDATE PROFILE:
- Name: ${ctx.fullName || "Not provided"}
- Skills on file: ${ctx.skills.length > 0 ? ctx.skills.join(", ") : "None listed"}

CANDIDATE'S RESUME (extracted text):
${ctx.resumeText.slice(0, MAX_RESUME_CHARS) || "Not provided"}`;
}

const TYPE_INSTRUCTIONS: Record<InterviewType, string> = {
  technical: `All questions must be type "technical" — real technical/problem-solving questions grounded in the target role, job description, and the candidate's actual listed skills.`,
  hr: `All questions must be type "hr" or "behavioral" — a mix of standard HR questions (motivation, career goals, work style) and behavioral/situational questions (past experience, teamwork, conflict resolution).`,
  mixed: `Blend question types: roughly half "technical" (grounded in the target role and candidate's skills) and half "hr"/"behavioral" (motivation, teamwork, past experience).`,
};

export function buildQuestionGenerationMessages(
  ctx: InterviewCandidateContext,
  interviewType: InterviewType,
  questionCount: number
): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: `You are an experienced interviewer for CareerPilot AI, conducting a mock interview to help a candidate practice for a real job.

Generate exactly ${questionCount} interview questions for this candidate and role. ${TYPE_INSTRUCTIONS[interviewType]}

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{
  "questions": [
    { "question": string, "type": "technical" | "behavioral" | "hr" }
  ]
}

Rules:
- Exactly ${questionCount} questions, ordered from easier/warm-up to more in-depth.
- Ground technical questions in the actual job description and the candidate's real listed skills — never ask about a technology that appears nowhere in the role or the candidate's background.
- Each question should be answerable in 1-3 minutes when spoken aloud.
- Do not repeat the same underlying question twice.`,
    },
    {
      role: "user",
      content: contextBlock(ctx),
    },
  ];
}

export function buildAnswerEvaluationMessages(
  ctx: InterviewCandidateContext,
  question: string,
  questionType: string,
  answerText: string
): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: `You are an experienced interviewer for CareerPilot AI, evaluating one answer during a mock interview. Be constructive but honest — this is practice, so real, specific feedback matters more than encouragement alone.

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{
  "score": number (0-100, how strong this answer is for the question asked),
  "feedback": string (2-4 sentences: what was good, what was missing or could be stronger)
}

Rules:
- Score based only on the actual content of the answer given — a short but sharp answer can score well; a long but vague one should not.
- If the answer is empty, off-topic, or just says something like "I don't know", score it low (under 30) and say so plainly rather than softening it.
- Never fabricate specifics the candidate didn't actually say.`,
    },
    {
      role: "user",
      content: `TARGET ROLE: ${ctx.targetRole}
QUESTION TYPE: ${questionType}
QUESTION ASKED: ${question}

CANDIDATE'S ANSWER:
${answerText.slice(0, MAX_ANSWER_CHARS) || "(no answer given)"}`,
    },
  ];
}

export interface TranscriptEntry {
  question: string;
  type: string;
  answer: string;
  score: number;
}

export function buildSessionSummaryMessages(
  ctx: InterviewCandidateContext,
  transcript: TranscriptEntry[]
): OpenRouterMessage[] {
  const transcriptText = transcript
    .map(
      (t, i) =>
        `Q${i + 1} (${t.type}): ${t.question}\nAnswer: ${t.answer || "(no answer given)"}\nScore given: ${t.score}/100`
    )
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are an experienced interviewer for CareerPilot AI, writing the final wrap-up for a completed mock interview. Review the full transcript and produce an overall assessment.

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:

{
  "overall_score": number (0-100),
  "technical_score": number (0-100, depth and accuracy of technical answers — if there were no technical questions, base this on problem-solving shown elsewhere),
  "communication_score": number (0-100, clarity, structure, and articulation across all answers),
  "confidence_score": number (0-100, decisiveness and command shown in the answers' wording — not a guess about the candidate's personality, only what the transcript shows),
  "strengths": string[] (2-5 genuine strengths shown across the interview),
  "weaknesses": string[] (2-5 genuine areas to improve),
  "recommendations": string[] (3-6 specific, actionable suggestions for their next interview),
  "summary": string (2-3 sentence overall summary)
}

Rules:
- Base every judgment only on what's actually in the transcript below — never invent specifics the candidate didn't say.
- The per-question scores already given are a signal, not a rule — weigh the transcript itself.`,
    },
    {
      role: "user",
      content: `TARGET ROLE: ${ctx.targetRole}

FULL TRANSCRIPT:
${transcriptText}`,
    },
  ];
}
