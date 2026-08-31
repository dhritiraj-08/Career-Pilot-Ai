import { NextResponse } from "next/server";
import { extractText } from "unpdf";

import { createClient } from "@/lib/supabase/server";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildQuestionGenerationMessages, type InterviewCandidateContext } from "@/lib/ai/prompts/interview";
import { fallbackQuestions } from "@/lib/ai/fallbacks/interview";
import {
  parseGeneratedQuestions,
  INTERVIEW_TYPES,
  QUESTION_COUNTS,
  type InterviewType,
  type InterviewQuestionItem,
} from "@/lib/validations/interview";

interface RequestBody {
  resumeId?: string;
  jobDescription?: string;
  targetRole?: string;
  interviewType?: string;
  questionCount?: number;
}

// Question generation + (for a returning resume) on-demand PDF
// extraction can both take a few seconds.
export const maxDuration = 60;

/**
 * Starts a mock interview: generates the full question set up front
 * (one LLM call, not one per question — keeps latency predictable and
 * lets the questions be planned as a coherent set), saves the session
 * and all questions, and returns the first question.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const resumeId = body?.resumeId?.trim();
  const jobDescription = body?.jobDescription?.trim() ?? "";
  const targetRole = body?.targetRole?.trim();
  const interviewType = body?.interviewType as InterviewType | undefined;
  const questionCount = body?.questionCount;

  if (!resumeId || !targetRole) {
    return NextResponse.json({ error: "resumeId and targetRole are required" }, { status: 400 });
  }
  if (!interviewType || !INTERVIEW_TYPES.includes(interviewType)) {
    return NextResponse.json({ error: "interviewType must be technical, hr, or mixed" }, { status: 400 });
  }
  if (!questionCount || !QUESTION_COUNTS.includes(questionCount as (typeof QUESTION_COUNTS)[number])) {
    return NextResponse.json({ error: "questionCount must be 5, 10, or 15" }, { status: 400 });
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, file_url, parsed_content")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (resumeError || !resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  // Same on-demand-extract-then-cache pattern as the Resume Architect
  // route — parsed_content only ever held the raw extracted text there
  // too, so a resume analyzed once doesn't need re-extraction here.
  const existingParsedContent = (resume.parsed_content ?? {}) as Record<string, unknown>;
  let resumeText = typeof existingParsedContent.extracted_text === "string" ? existingParsedContent.extracted_text : "";

  if (!resumeText) {
    const { data: fileBlob, error: downloadError } = await supabase.storage.from("resumes").download(resume.file_url);
    if (downloadError || !fileBlob) {
      return NextResponse.json({ error: "Couldn't read resume file" }, { status: 500 });
    }
    try {
      const buffer = new Uint8Array(await fileBlob.arrayBuffer());
      const { text } = await extractText(buffer, { mergePages: true });
      resumeText = text.trim();
      if (resumeText) {
        await supabase
          .from("resumes")
          .update({ parsed_content: { ...existingParsedContent, extracted_text: resumeText } })
          .eq("id", resumeId);
      }
    } catch {
      resumeText = "";
    }
  }

  const [{ data: profile }, { data: skillRows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("skills").select("name").eq("user_id", user.id),
  ]);

  const ctx: InterviewCandidateContext = {
    resumeText,
    jobDescription,
    targetRole,
    fullName: profile?.full_name ?? "",
    skills: (skillRows ?? []).map((s) => s.name),
  };

  let generatedQuestions: { question: string; type: "technical" | "behavioral" | "hr" }[] = [];
  let usedFallback = false;
  try {
    const raw = await callOpenRouter({
      messages: buildQuestionGenerationMessages(ctx, interviewType, questionCount),
      jsonMode: true,
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in question-generation response");
    generatedQuestions = parseGeneratedQuestions(JSON.parse(jsonMatch[0]), questionCount);
    if (generatedQuestions.length === 0) throw new Error("No questions parsed from response");
  } catch (err) {
    console.error("[interview] question generation failed:", err instanceof Error ? err.message : err);
    usedFallback = true;
    generatedQuestions = fallbackQuestions(interviewType, questionCount);
  }

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: user.id,
      resume_id: resumeId,
      job_title: targetRole,
      job_description: jobDescription || null,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("[interview] failed to create session:", sessionError?.message);
    return NextResponse.json({ error: "Couldn't start interview" }, { status: 500 });
  }

  const { data: insertedQuestions, error: questionsError } = await supabase
    .from("interview_questions")
    .insert(
      generatedQuestions.map((q, index) => ({
        session_id: session.id,
        question: q.question,
        question_type: q.type,
        order_index: index,
      }))
    )
    .select("id, question, question_type, order_index")
    .order("order_index", { ascending: true });

  if (questionsError || !insertedQuestions || insertedQuestions.length === 0) {
    console.error("[interview] failed to save questions:", questionsError?.message);
    // Clean up the orphaned session rather than leaving a session with
    // no questions a user could get stuck on.
    await supabase.from("interview_sessions").delete().eq("id", session.id);
    return NextResponse.json({ error: "Couldn't generate interview questions" }, { status: 500 });
  }

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "interview_agent",
    action: `Started a ${interviewType} mock interview for "${targetRole}" (${insertedQuestions.length} questions)`,
    status: "success",
    details: { usedFallback, questionCount: insertedQuestions.length },
  });

  const first = insertedQuestions[0];
  const firstQuestion: InterviewQuestionItem = {
    id: first.id,
    question: first.question,
    type: first.question_type as InterviewQuestionItem["type"],
    orderIndex: first.order_index,
  };

  return NextResponse.json({
    sessionId: session.id,
    totalQuestions: insertedQuestions.length,
    question: firstQuestion,
    usedFallback,
  });
}
