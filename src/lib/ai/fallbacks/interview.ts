import type { InterviewType, QuestionType } from "@/lib/validations/interview";

// ---------------------------------------------------------------------
// Question generation fallback
//
// Generic but real interview questions (not fabricated data about the
// candidate) — used only if question-generation fails outright. Not
// tailored to the specific job description since that requires the LLM,
// but honest about being a fallback via the caller's usedFallback flag.
// ---------------------------------------------------------------------
const TECHNICAL_BANK = [
  "Walk me through a recent project you're proud of — what was your specific role in it?",
  "Describe a time you had to debug a difficult problem. What was your approach?",
  "How do you decide between two technical approaches when there's no obviously correct answer?",
  "What's a technical concept you've had to learn recently, and how did you learn it?",
  "How do you approach code review — both giving and receiving feedback?",
  "Describe how you'd design a system to handle [a core responsibility of this role]. What trade-offs would you consider?",
  "Tell me about a time a project didn't go as planned technically. What did you do?",
  "How do you keep your technical skills up to date?",
  "What does 'good code' mean to you?",
  "Describe your experience with testing — how do you decide what to test?",
  "How would you explain a complex technical concept to a non-technical stakeholder?",
  "Tell me about a time you had to make a trade-off between speed and quality.",
  "What's the most challenging bug you've fixed, and how did you find it?",
  "How do you approach learning a new technology required for a project?",
  "Describe a time you disagreed with a technical decision on your team.",
];

const HR_BANK = [
  "Tell me about yourself and why you're interested in this role.",
  "Why are you looking to leave your current position?",
  "Describe a time you worked with a difficult team member. How did you handle it?",
  "Where do you see yourself in the next few years?",
  "Tell me about a time you failed at something. What did you learn?",
  "How do you handle stress or tight deadlines?",
  "Describe a situation where you had to persuade someone to see things your way.",
  "What motivates you in your work?",
  "Tell me about a time you took initiative without being asked.",
  "How do you prioritize when you have multiple competing deadlines?",
  "Describe your ideal work environment.",
  "Tell me about a time you received difficult feedback. How did you respond?",
  "What are you looking for in your next role that you don't have now?",
  "Describe a time you had to adapt quickly to a change.",
  "Why should we hire you for this role?",
];

export function fallbackQuestions(
  interviewType: InterviewType,
  questionCount: number
): { question: string; type: QuestionType }[] {
  const pickTechnical = interviewType === "technical" || interviewType === "mixed";
  const pickHr = interviewType === "hr" || interviewType === "mixed";

  const pool: { question: string; type: QuestionType }[] = [];
  if (pickTechnical) pool.push(...TECHNICAL_BANK.map((question) => ({ question, type: "technical" as const })));
  if (pickHr) pool.push(...HR_BANK.map((question) => ({ question, type: "hr" as const })));

  // Interleave for "mixed" rather than running all technical then all
  // HR, so the fallback set at least resembles a real interview shape.
  if (interviewType === "mixed") {
    const technical = pool.filter((q) => q.type === "technical");
    const hr = pool.filter((q) => q.type === "hr");
    const interleaved: typeof pool = [];
    for (let i = 0; i < Math.max(technical.length, hr.length); i++) {
      if (technical[i]) interleaved.push(technical[i]);
      if (hr[i]) interleaved.push(hr[i]);
    }
    return interleaved.slice(0, questionCount);
  }

  return pool.slice(0, questionCount);
}

// ---------------------------------------------------------------------
// Answer evaluation fallback — a real, if crude, heuristic (length and
// substance) rather than a fabricated score, used only if the
// evaluation LLM call fails.
// ---------------------------------------------------------------------
export function fallbackAnswerEvaluation(answerText: string): { score: number; feedback: string } {
  const trimmed = answerText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  if (wordCount === 0) {
    return { score: 0, feedback: "No answer was given for this question." };
  }
  if (wordCount < 8) {
    return {
      score: 30,
      feedback:
        "This answer was quite brief. AI evaluation was unavailable, so this is a length-based estimate only — try expanding with a specific example next time.",
    };
  }
  if (wordCount < 30) {
    return {
      score: 55,
      feedback:
        "This answer had some substance. AI evaluation was unavailable, so this is a length-based estimate only.",
    };
  }
  return {
    score: 70,
    feedback:
      "This answer was reasonably detailed. AI evaluation was unavailable, so this is a length-based estimate only — re-check this interview's full report once AI scoring is back for a real assessment.",
  };
}

// ---------------------------------------------------------------------
// Session summary fallback — computed from the real per-answer scores
// already on file, not fabricated.
// ---------------------------------------------------------------------
export interface FallbackSummaryInput {
  scores: number[];
  technicalScores: number[];
  hrScores: number[];
}

export function fallbackSessionSummary(input: FallbackSummaryInput) {
  const avg = (nums: number[]) => (nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 50);

  const overallScore = avg(input.scores);
  const technicalScore = input.technicalScores.length > 0 ? avg(input.technicalScores) : overallScore;
  const communicationScore = overallScore; // no independent signal without the LLM
  const confidenceScore = overallScore;

  return {
    overallScore,
    technicalScore,
    communicationScore,
    confidenceScore,
    strengths: ["Completed the mock interview session."],
    weaknesses: ["AI-written feedback was unavailable for this session — scores are based on answer length only."],
    recommendations: ["Try this interview again shortly for full AI-written feedback on each answer."],
    summary:
      "AI summary generation was temporarily unavailable, so this report is based on automated per-answer scoring only.",
  };
}
