import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ResumeArchitectClient } from "@/components/resume-architect/resume-architect-client";

export default async function ResumeArchitectPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, name, is_primary")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Resume Architect</h1>
      <ResumeArchitectClient
        resumes={(resumes ?? []).map((r) => ({ id: r.id, name: r.name, isPrimary: r.is_primary }))}
      />
    </div>
  );
}
