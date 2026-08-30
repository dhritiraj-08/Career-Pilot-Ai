import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/**
 * Shared shell for every /dashboard/* page (dashboard, profile,
 * resumes, ...). Every page under here is per-user and session-
 * dependent, so it must never be statically prerendered —
 * force-dynamic also means `next build` doesn't need real Supabase
 * credentials just to build.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards every /dashboard/* route; this is a
  // defensive fallback, not the primary gate.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      fullName={profile?.full_name ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
      email={user.email ?? null}
    >
      {children}
    </DashboardShell>
  );
}
