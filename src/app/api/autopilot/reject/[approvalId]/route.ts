import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * User rejects a drafted item: never sent. For a job application with
 * a linked job_applications row, that row moves to "withdrawn" rather
 * than the spec's literal "rejected" — job_applications' own status
 * vocabulary (see docs/schema.sql) reserves "rejected" for the
 * employer's decision after a real application went out, which never
 * happened here; "withdrawn" (the user declined to send it) is what
 * this actually is and avoids a misleading "Rejected" badge appearing
 * on the Jobs page for an application nobody ever received.
 */
export async function POST(_request: Request, { params }: { params: { approvalId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: approval, error: fetchError } = await supabase
    .from("autopilot_approvals")
    .select("*")
    .eq("id", params.approvalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }
  if (approval.status !== "pending") {
    return NextResponse.json({ error: `Already ${approval.status}` }, { status: 400 });
  }

  await supabase.from("autopilot_approvals").update({ status: "rejected" }).eq("id", approval.id);

  if (approval.job_application_id) {
    await supabase.from("job_applications").update({ status: "withdrawn" }).eq("id", approval.job_application_id);
  }

  const company = (approval.context as { company?: string } | null)?.company;
  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "orchestrator",
    action: `Skipped draft${company ? ` for ${company}` : ""}`,
    status: "success",
    details: { run_id: approval.run_id, approval_id: approval.id },
  });

  return NextResponse.json({ success: true });
}
