import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ProfilePageClient, type ProfilePageData } from "@/components/profile/profile-page-client";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: skills }, { data: education }, { data: certifications }, { data: jobPreferences }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("skills").select("id, name, level").eq("user_id", user.id).order("created_at"),
      supabase
        .from("education")
        .select("id, institution, degree, field, start_date, end_date, grade")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("certifications")
        .select("id, name, issuer, issue_date, expiry_date, credential_url")
        .eq("user_id", user.id)
        .order("issue_date", { ascending: false }),
      supabase.from("job_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

  const initial: ProfilePageData = {
    userId: user.id,
    avatarUrl: profile?.avatar_url ?? null,
    overview: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
      bio: profile?.bio ?? "",
      current_job_role: profile?.current_job_role ?? "",
      current_company: profile?.current_company ?? "",
      years_experience: profile?.years_experience ?? 0,
    },
    skills: (skills ?? []).map((s) => ({ id: s.id, name: s.name, level: s.level })),
    education: (education ?? []).map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree ?? "",
      field: e.field ?? "",
      start_year: e.start_date ? new Date(e.start_date).getFullYear() : new Date().getFullYear(),
      end_year: e.end_date ? new Date(e.end_date).getFullYear() : undefined,
      grade: e.grade ?? "",
    })),
    certifications: (certifications ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer ?? "",
      issue_date: c.issue_date ?? "",
      expiry_date: c.expiry_date ?? "",
      credential_url: c.credential_url ?? "",
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Your profile</h1>
      <ProfilePageClient initial={initial} />
    </div>
  );
}
