import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { runJobHunterSearch, type JobHunterResultItem } from "@/lib/agents/job-hunter";
import { runResumeArchitectAnalysis } from "@/lib/agents/resume-architect";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildComposeMessages, type ComposeContext } from "@/lib/ai/prompts/email";
import { fallbackComposeEmail } from "@/lib/ai/fallbacks/email";
import { parseComposedEmail } from "@/lib/validations/email";
import { clampSettings, extractEmailFromApplyUrl, type AutopilotSettingsRow } from "@/lib/validations/autopilot";

// The pipeline itself (job search + up to N × resume tailoring + email
// draft, each its own LLM call) can run well past a minute — see the
// fire-and-forget note below. maxDuration here mostly bounds the
// synchronous part (creating the run row) plus whatever of the
// background work a given platform lets finish before freezing the
// function; it does not guarantee the whole pipeline completes.
export const maxDuration = 60;

/**
 * Starts an Autopilot run: creates the autopilot_runs row and returns
 * immediately with its id, then keeps working in the background — the
 * frontend polls GET /api/autopilot/status/[runId] for progress.
 *
 * Honest platform note: the background work below is a plain
 * un-awaited async call, not a real job queue. On a persistent Node
 * server (`next dev` / `next start`, which is how this app runs today)
 * the process keeps running after the response is sent, so this
 * reliably finishes. On a serverless platform (e.g. Vercel) a function
 * can freeze immediately after its response — Next 14.2 (this
 * project's version) doesn't yet export `unstable_after` to solve that
 * cleanly, and no job queue is set up here. If this ever moves to a
 * serverless deploy, this route needs either an upgrade to a Next
 * version with `after()`/`waitUntil`, or a real background-job
 * mechanism — flagging this rather than quietly shipping something
 * that only works in one environment.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!resume) {
    return NextResponse.json({ error: "Add a resume to your vault before running Autopilot" }, { status: 400 });
  }

  const { data: settingsRow } = await supabase
    .from("autopilot_settings")
    .select("min_match_score, max_applications_per_day, auto_schedule")
    .eq("user_id", user.id)
    .maybeSingle();
  const settings = clampSettings({
    minMatchScore: settingsRow?.min_match_score,
    maxApplicationsPerDay: settingsRow?.max_applications_per_day,
    autoSchedule: settingsRow?.auto_schedule,
  });

  const { data: run, error: runInsertError } = await supabase
    .from("autopilot_runs")
    .insert({ user_id: user.id, status: "running" })
    .select("id")
    .single();

  if (runInsertError || !run) {
    console.error("[autopilot] failed to start run:", runInsertError?.message);
    return NextResponse.json({ error: "Couldn't start a run" }, { status: 500 });
  }

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "orchestrator",
    action: "Autopilot run started",
    status: "running",
    details: { run_id: run.id },
  });

  // Fire-and-forget — see the platform note in the doc comment above.
  executeAutopilotRun(supabase, user.id, run.id, settings, resume.id).catch((err) => {
    console.error("[autopilot] unhandled error in background run:", err instanceof Error ? err.message : err);
  });

  return NextResponse.json({ runId: run.id, status: "running" });
}

async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  action: string,
  status: "running" | "success" | "failed",
  jobListingId?: string
) {
  await supabase.from("agent_activities").insert({
    user_id: userId,
    agent_name: "orchestrator",
    action,
    status,
    details: { run_id: runId, ...(jobListingId ? { job_listing_id: jobListingId } : {}) },
  });
}

async function executeAutopilotRun(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  settings: AutopilotSettingsRow,
  resumeId: string
) {
  try {
    await logActivity(supabase, userId, runId, "Searching for matching jobs", "running");

    const searchResult = await runJobHunterSearch(supabase, userId, {});
    if ("error" in searchResult) {
      throw new Error(searchResult.error);
    }
    const allJobs: JobHunterResultItem[] = searchResult.jobs;

    await supabase.from("autopilot_runs").update({ jobs_found: allJobs.length }).eq("id", runId);

    // Full score distribution, every time — this is the single most
    // useful thing to have in the console/logs when "0 drafts" gets
    // reported, since it answers "why" immediately instead of needing
    // a database query to find out.
    const sortedByScore = [...allJobs].sort((a, b) => b.score - a.score);
    console.log(
      `[autopilot] run ${runId}: ${allJobs.length} jobs found, threshold ${settings.min_match_score}%. Top scores:`,
      sortedByScore.slice(0, 10).map((j) => `${j.score}% ${j.title} @ ${j.company}`)
    );

    const aboveThreshold = allJobs.filter((j) => j.score >= settings.min_match_score);
    console.log(`[autopilot] run ${runId}: ${aboveThreshold.length} of ${allJobs.length} jobs meet the ${settings.min_match_score}% threshold`);

    await logActivity(
      supabase,
      userId,
      runId,
      `Found ${allJobs.length} job${allJobs.length === 1 ? "" : "s"} — ${aboveThreshold.length} at or above your ${settings.min_match_score}% threshold` +
        (allJobs.length > 0 ? ` (best match: ${sortedByScore[0].score}%)` : ""),
      "success"
    );

    // Never re-draft a job that's already past "saved" (already applied,
    // interviewing, etc.) or that already has a live (non-rejected)
    // approval from a previous run.
    const candidateJobs = aboveThreshold.filter((j) => j.applicationStatus === null || j.applicationStatus === "saved");
    console.log(`[autopilot] run ${runId}: ${candidateJobs.length} of ${aboveThreshold.length} above-threshold jobs aren't already applied/withdrawn/etc.`);

    const { data: existingApprovals, error: existingApprovalsError } =
      candidateJobs.length > 0
        ? await supabase
            .from("autopilot_approvals")
            .select("job_listing_id")
            .eq("user_id", userId)
            .neq("status", "rejected")
            .in(
              "job_listing_id",
              candidateJobs.map((j) => j.id)
            )
        : { data: [], error: null };
    if (existingApprovalsError) {
      console.error(`[autopilot] run ${runId}: failed to check existing approvals:`, existingApprovalsError.message);
    }
    const alreadyDrafted = new Set((existingApprovals ?? []).map((r) => r.job_listing_id));
    console.log(`[autopilot] run ${runId}: ${alreadyDrafted.size} candidate jobs already have a live (non-rejected) approval from a previous run`);

    // "Max applications per day" is enforced across the whole day, not
    // just this run — a second run today only gets whatever headroom is
    // left under the cap.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: draftedToday, error: draftedTodayError } = await supabase
      .from("autopilot_approvals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "job_application")
      .gte("created_at", todayStart.toISOString());
    if (draftedTodayError) {
      console.error(`[autopilot] run ${runId}: failed to count today's drafts:`, draftedTodayError.message);
    }
    const remainingToday = Math.max(0, settings.max_applications_per_day - (draftedToday ?? 0));
    console.log(`[autopilot] run ${runId}: daily cap ${settings.max_applications_per_day}, ${draftedToday ?? 0} drafted today already, ${remainingToday} slots remaining`);

    const matches = candidateJobs.filter((j) => !alreadyDrafted.has(j.id)).slice(0, remainingToday);
    console.log(`[autopilot] run ${runId}: ${matches.length} jobs will get a drafted application this run:`, matches.map((j) => `${j.title} @ ${j.company}`));

    if (matches.length === 0) {
      const reason =
        remainingToday === 0
          ? `Daily cap of ${settings.max_applications_per_day} applications already reached — no new drafts this run.`
          : aboveThreshold.length === 0
            ? allJobs.length > 0
              ? `No jobs met your ${settings.min_match_score}% threshold this run (best match was ${sortedByScore[0].score}%) — try lowering "Minimum match score" in Parameters.`
              : "No jobs found this run."
            : "Every matching job already has a draft or application from a previous run.";
      await logActivity(supabase, userId, runId, reason, "success");
      await supabase
        .from("autopilot_runs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", runId);
      return;
    }

    const [{ data: profile }, { data: skillRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, current_job_role, current_company, years_experience")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("skills").select("name").eq("user_id", userId),
    ]);

    let draftsCreated = 0;

    for (const job of matches) {
      await logActivity(supabase, userId, runId, `Tailoring resume for ${job.title} at ${job.company}`, "running", job.id);

      const analysis = await runResumeArchitectAnalysis(supabase, userId, {
        resumeId,
        jobDescription: job.description ?? `${job.title} at ${job.company}`,
        targetRole: job.title,
      });

      if ("error" in analysis) {
        console.error(`[autopilot] run ${runId}: resume-architect analysis failed for ${job.title} @ ${job.company}: ${analysis.error} (status ${analysis.status})`);
        await logActivity(
          supabase,
          userId,
          runId,
          `Couldn't tailor a resume for ${job.title} at ${job.company}: ${analysis.error}`,
          "failed",
          job.id
        );
        continue;
      }

      const composeCtx: ComposeContext = {
        company: job.company,
        role: job.title,
        // Real, derived context — not fabricated: the resume analysis's
        // own top strengths plus which of the candidate's actual skills
        // this specific listing matched on.
        highlights: [...analysis.strengths.slice(0, 3), ...job.matchedSkills.slice(0, 5)].join("; "),
        recipientName: "",
        candidateName: profile?.full_name ?? "",
        currentJobRole: profile?.current_job_role ?? "",
        currentCompany: profile?.current_company ?? "",
        yearsExperience: profile?.years_experience ?? null,
        skills: (skillRows ?? []).map((s) => s.name),
        resumeText: analysis.resumeText,
      };

      let draft;
      try {
        const raw = await callOpenRouter({ messages: buildComposeMessages("application", composeCtx), jsonMode: true });
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON object found in compose response");
        draft = parseComposedEmail(JSON.parse(jsonMatch[0]));
        if (!draft.body) throw new Error("Empty body in compose response");
      } catch (err) {
        console.error("[autopilot] compose failed, using fallback:", err instanceof Error ? err.message : err);
        draft = fallbackComposeEmail("application", composeCtx);
      }

      const emailTo = extractEmailFromApplyUrl(job.applyUrl);

      // Tracked the same way the Jobs page's own Save/Apply does — this
      // is what lets an approval later flip a real job_applications row
      // to "applied". Errors here were previously never checked at all
      // — a failed upsert silently left job_application_id null and
      // execution carried on as if nothing was wrong.
      const { data: application, error: applicationError } = await supabase
        .from("job_applications")
        .upsert(
          {
            user_id: userId,
            job_listing_id: job.id,
            resume_id: resumeId,
            status: "saved",
            match_score: job.score,
            missing_skills: job.missingSkills,
          },
          { onConflict: "user_id,job_listing_id" }
        )
        .select("id")
        .maybeSingle();

      if (applicationError) {
        console.error(`[autopilot] run ${runId}: job_applications upsert failed for ${job.title} @ ${job.company}:`, {
          message: applicationError.message,
          details: applicationError.details,
          hint: applicationError.hint,
          code: applicationError.code,
        });
        // Not fatal on its own — the approval below can still be
        // created with job_application_id null — but worth surfacing,
        // since it means "Approve" won't be able to flip a
        // job_applications row to "applied" for this one.
        await logActivity(
          supabase,
          userId,
          runId,
          `Couldn't save a job_applications record for ${job.title} at ${job.company}: ${applicationError.message}`,
          "failed",
          job.id
        );
      }

      const { error: approvalInsertError } = await supabase.from("autopilot_approvals").insert({
        user_id: userId,
        run_id: runId,
        type: "job_application",
        status: "pending",
        job_listing_id: job.id,
        job_application_id: application?.id ?? null,
        email_draft_subject: draft.subject,
        email_draft_body: draft.body,
        email_to: emailTo,
        resume_id: resumeId,
        context: { company: job.company, role: job.title, matchScore: job.score, applyUrl: job.applyUrl },
      });

      if (approvalInsertError) {
        // This is the exact failure mode "0 drafts created" would
        // actually look like if the pipeline reached this point at
        // all — logged in full (message/details/hint/code, the same
        // shape Postgres actually returns) rather than swallowed.
        console.error(`[autopilot] run ${runId}: autopilot_approvals insert FAILED for ${job.title} @ ${job.company}:`, {
          message: approvalInsertError.message,
          details: approvalInsertError.details,
          hint: approvalInsertError.hint,
          code: approvalInsertError.code,
        });
        await logActivity(
          supabase,
          userId,
          runId,
          `Couldn't create a draft for ${job.title} at ${job.company}: ${approvalInsertError.message}`,
          "failed",
          job.id
        );
        continue; // did NOT create a draft — don't count it or notify as if it did
      }

      draftsCreated++;
      await supabase.from("autopilot_runs").update({ drafts_created: draftsCreated }).eq("id", runId);

      await supabase.from("notifications").insert({
        user_id: userId,
        title: `Draft ready: ${job.title} at ${job.company}`,
        message: emailTo
          ? "Review the drafted application and approve to send."
          : "No direct email address found on this listing — add a recipient in Edit & Approve before sending, or apply via the listing link.",
        type: "info",
        link: "/dashboard/autopilot",
      });

      await logActivity(supabase, userId, runId, `Draft ready for ${job.title} at ${job.company} — awaiting your approval`, "success", job.id);
    }

    await supabase.from("autopilot_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", runId);
    await logActivity(
      supabase,
      userId,
      runId,
      `Run completed — ${draftsCreated} draft${draftsCreated === 1 ? "" : "s"} ready for review`,
      "success"
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[autopilot] run failed:", message);
    await supabase
      .from("autopilot_runs")
      .update({ status: "failed", completed_at: new Date().toISOString(), error_message: message })
      .eq("id", runId);
    await logActivity(supabase, userId, runId, `Run failed: ${message}`, "failed");
  }
}
