import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { clampSettings } from "@/lib/validations/autopilot";

interface RequestBody {
  minMatchScore?: number;
  maxApplicationsPerDay?: number;
  autoSchedule?: string;
}

// Not one of the explicitly listed routes, but necessary — the
// parameters panel's "user sets these once, saved to profile" needs
// somewhere to read from and write to.

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("autopilot_settings")
    .select("min_match_score, max_applications_per_day, auto_schedule")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json(
    clampSettings({
      minMatchScore: data?.min_match_score,
      maxApplicationsPerDay: data?.max_applications_per_day,
      autoSchedule: data?.auto_schedule,
    })
  );
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const settings = clampSettings({
    minMatchScore: body?.minMatchScore,
    maxApplicationsPerDay: body?.maxApplicationsPerDay,
    autoSchedule: body?.autoSchedule,
  });

  const { error } = await supabase
    .from("autopilot_settings")
    .upsert({ user_id: user.id, ...settings }, { onConflict: "user_id" });

  if (error) {
    console.error("[autopilot] failed to save settings:", error.message);
    return NextResponse.json({ error: "Couldn't save settings" }, { status: 500 });
  }

  return NextResponse.json(settings);
}
