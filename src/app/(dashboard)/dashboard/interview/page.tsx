import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InterviewClient } from "@/components/interview/interview-client";

export default async function InterviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: resumes }, { data: preferences }] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, name, is_primary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("job_preferences").select("target_roles").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Interview Agent</h1>
      <InterviewClient
        resumes={(resumes ?? []).map((r) => ({ id: r.id, name: r.name, isPrimary: r.is_primary }))}
        defaultTargetRole={preferences?.target_roles?.[0] ?? ""}
      />
    </div>
  );
}
