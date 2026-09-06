import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { runResumeArchitectAnalysis } from "@/lib/agents/resume-architect";

interface RequestBody {
  resumeId?: string;
  jobDescription?: string;
  targetRole?: string;
}

// Three sequential LLM calls (see lib/agents/resume-architect.ts) can
// run long. No effect locally, but declares intent for a future Vercel
// deployment where serverless functions have a platform execution-time
// cap.
export const maxDuration = 60;

/**
 * Three separate LLM calls rather than one giant JSON response —
 * analysis (JSON mode, small/constrained output — reliable) then two
 * plain-text generations (tailored resume, cover letter). The actual
 * work lives in lib/agents/resume-architect.ts — the Autopilot
 * orchestrator (api/autopilot/run) calls that same function directly,
 * once per matched job, rather than hitting this route over HTTP.
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
  const jobDescription = body?.jobDescription?.trim();
  const targetRole = body?.targetRole?.trim();

  if (!resumeId || !jobDescription || !targetRole) {
    return NextResponse.json(
      { error: "resumeId, jobDescription, and targetRole are all required" },
      { status: 400 }
    );
  }

  const result = await runResumeArchitectAnalysis(supabase, user.id, { resumeId, jobDescription, targetRole });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // resumeText is an internal detail the orchestrator needs — the
  // original route response never included it.
  const { candidateName, atsScore, scoreBreakdown, keywordsFound, keywordsMissing, strengths, weaknesses, recommendations, tailoredResumeContent, coverLetterContent, usedFallback } = result;
  return NextResponse.json({
    candidateName,
    atsScore,
    scoreBreakdown,
    keywordsFound,
    keywordsMissing,
    strengths,
    weaknesses,
    recommendations,
    tailoredResumeContent,
    coverLetterContent,
    usedFallback,
  });
}
