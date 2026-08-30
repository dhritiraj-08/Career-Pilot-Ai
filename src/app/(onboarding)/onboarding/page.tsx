import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { SkillValue } from "@/lib/validations/onboarding";
import {
  OnboardingWizard,
  type OnboardingInitialData,
} from "@/components/onboarding/onboarding-wizard";

/**
 * Fetches whatever the user has already saved (each step writes to
 * Supabase immediately) so a page refresh mid-wizard doesn't lose data —
 * the wizard always restarts at Step 1, but every step is pre-filled.
 */
export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: skills }, { data: education }, { data: jobPreferences }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("skills").select("name, level").eq("user_id", user.id),
      supabase
        .from("education")
        .select("institution, degree, field, start_date, end_date, grade")
        .eq("user_id", user.id),
      supabase.from("job_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

  const initialData: OnboardingInitialData = {
    basicInfo: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
      bio: profile?.bio ?? "",
    },
    experience: {
      current_job_role: profile?.current_job_role ?? "",
      current_company: profile?.current_company ?? "",
      years_experience: profile?.years_experience ?? 0,
    },
    skills: (skills ?? []).map(
      (s): SkillValue => ({ name: s.name, level: s.level as SkillValue["level"] })
    ),
    education: (education ?? []).map((e) => ({
      institution: e.institution,
      degree: e.degree ?? "",
      field: e.field ?? "",
      start_year: e.start_date ? new Date(e.start_date).getFullYear() : new Date().getFullYear(),
      end_year: e.end_date ? new Date(e.end_date).getFullYear() : undefined,
      grade: e.grade ?? "",
    })),
    jobPreferences: {
      target_roles: jobPreferences?.target_roles ?? [],
      target_fields: jobPreferences?.target_fields ?? [],
      min_salary: jobPreferences?.min_salary != null ? String(jobPreferences.min_salary) : undefined,
      max_salary: jobPreferences?.max_salary != null ? String(jobPreferences.max_salary) : undefined,
      currency: jobPreferences?.currency ?? "INR",
      work_mode: jobPreferences?.work_mode ?? undefined,
      preferred_locations: jobPreferences?.preferred_locations ?? [],
      notice_period: jobPreferences?.notice_period ?? "",
      job_search_status: jobPreferences?.job_search_status ?? "active",
    },
    socialLinks: {
      linkedin_url: profile?.linkedin_url ?? "",
      github_url: profile?.github_url ?? "",
      portfolio_url: profile?.portfolio_url ?? "",
    },
  };

  return (
    <div className="flex justify-center py-8">
      <OnboardingWizard userId={user.id} email={user.email ?? null} initialData={initialData} />
    </div>
  );
}
