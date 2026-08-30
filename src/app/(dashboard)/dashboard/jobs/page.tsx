import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { JobHunterClient } from "@/components/jobs/job-hunter-client";
import type { JobSearchFilters } from "@/components/jobs/job-search-form";

export default async function JobsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: preferences } = await supabase
    .from("job_preferences")
    .select("target_roles, preferred_locations, work_mode, min_salary")
    .eq("user_id", user.id)
    .maybeSingle();

  const defaultFilters: JobSearchFilters = {
    workModes: preferences?.work_mode && preferences.work_mode !== "any" ? [preferences.work_mode as "remote" | "hybrid" | "onsite"] : [],
    location: preferences?.preferred_locations?.[0] ?? "",
    role: preferences?.target_roles?.[0] ?? "",
    minSalary: preferences?.min_salary ? String(preferences.min_salary) : "",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Job Hunter</h1>
      <JobHunterClient defaultFilters={defaultFilters} />
    </div>
  );
}
