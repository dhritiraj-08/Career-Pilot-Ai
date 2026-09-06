import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { APPROVAL_TYPES, type ApprovalType, type AutopilotApprovalRow } from "@/lib/validations/autopilot";

/** All pending approvals for the Notification Center, grouped by type
 * so the UI can show them under their own heading/badge count. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: approvals, error } = await supabase
    .from("autopilot_approvals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    // This query returning cleanly-empty vs. actually-failing looked
    // identical to the frontend before this — log the real reason
    // rather than silently handing back an empty list either way.
    console.error("[autopilot] failed to fetch pending approvals:", { message: error.message, details: error.details, hint: error.hint, code: error.code });
    return NextResponse.json({ error: "Couldn't load approvals" }, { status: 500 });
  }

  const rows = (approvals ?? []) as AutopilotApprovalRow[];
  const grouped = Object.fromEntries(APPROVAL_TYPES.map((t) => [t, [] as AutopilotApprovalRow[]])) as Record<
    ApprovalType,
    AutopilotApprovalRow[]
  >;
  for (const row of rows) {
    grouped[row.type]?.push(row);
  }

  return NextResponse.json({ approvals: rows, grouped, count: rows.length });
}
