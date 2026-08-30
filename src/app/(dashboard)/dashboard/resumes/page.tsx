import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ResumeVaultClient, type ResumeRow } from "@/components/resumes/resume-vault-client";

export default async function ResumesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, name, file_url, parsed_content, is_primary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Resume Vault</h1>
      <ResumeVaultClient userId={user.id} initialResumes={(resumes ?? []) as ResumeRow[]} />
    </div>
  );
}
