import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile },
    { count: skillsCount },
    { count: educationCount },
    { data: jobPreferences },
    { count: resumesCount },
    { count: jobsDiscoveredCount },
    { count: applicationsCount },
    { count: interviewSessionsCount },
    { data: recentActivity },
    { data: recentJobs },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("skills").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("education").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("job_preferences").select("target_roles").eq("user_id", user.id).maybeSingle(),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("job_listings").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("interview_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("agent_activities")
      .select("id, agent_name, action, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("job_listings")
      .select("id, title, company, location, apply_url")
      .eq("is_active", true)
      .order("discovered_at", { ascending: false })
      .limit(3),
  ]);

  const { percent, items } = computeProfileCompletion({
    hasAvatar: !!profile?.avatar_url,
    hasBasicInfo: !!(profile?.full_name && profile?.phone && profile?.city),
    hasExperience: !!(
      profile?.current_job_role ||
      profile?.current_company ||
      (profile?.years_experience ?? 0) > 0
    ),
    hasSkills: (skillsCount ?? 0) > 0,
    hasEducation: (educationCount ?? 0) > 0,
    hasJobPreferences: !!jobPreferences?.target_roles?.length,
    hasSocialLinks: !!(profile?.linkedin_url || profile?.github_url || profile?.portfolio_url),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DashboardContent
        fullName={profile?.full_name ?? ""}
        completionPercent={percent}
        completionItems={items}
        stats={{
          resumes: resumesCount ?? 0,
          jobsDiscovered: jobsDiscoveredCount ?? 0,
          applicationsSent: applicationsCount ?? 0,
          interviewSessions: interviewSessionsCount ?? 0,
        }}
        recentActivity={recentActivity ?? []}
        recentJobs={recentJobs ?? []}
      />
    </div>
  );
}
