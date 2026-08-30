"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type {
  BasicInfoValues,
  ExperienceValues,
  SkillValue,
  EducationEntryValues,
  JobPreferencesValues,
  SocialLinksValues,
} from "@/lib/validations/onboarding";
import type { ParsedResumeProfile } from "@/lib/validations/resume-parse";
import { ProgressBar } from "./progress-bar";
import { StepResumeUpload } from "./step-resume-upload";
import { StepBasicInfo } from "./step-basic-info";
import { StepExperience } from "./step-experience";
import { StepSkills } from "./step-skills";
import { StepEducation } from "./step-education";
import { StepJobPreferences } from "./step-job-preferences";
import { StepSocialLinks } from "./step-social-links";

const STEP_LABELS = [
  "Resume",
  "Basic Info",
  "Experience",
  "Skills",
  "Education",
  "Job Preferences",
  "Social Links",
];

export interface OnboardingInitialData {
  basicInfo: Partial<BasicInfoValues>;
  experience: Partial<ExperienceValues>;
  skills: SkillValue[];
  education: EducationEntryValues[];
  jobPreferences: Partial<JobPreferencesValues>;
  socialLinks: Partial<SocialLinksValues>;
}

interface OnboardingWizardProps {
  userId: string;
  email: string | null;
  initialData: OnboardingInitialData;
}

// Enter-only fade/slide for step transitions — see the comment above
// the motion.div below for why there's no exit animation.
const stepVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export function OnboardingWizard({ userId, email, initialData }: OnboardingWizardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  // Seeded from the server-fetched prop, but mutable: the Resume step
  // can fill this in mid-flow before any of the pre-fillable steps have
  // mounted (see the merge handler below for why that ordering matters).
  const [prefill, setPrefill] = React.useState<OnboardingInitialData>(initialData);

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  /** Runs a step's Supabase write, then advances — or, on the final
   * step, redirects to /dashboard. Shared by every step's save (and by
   * Skip / the resume-parse merge, which just pass a no-op / state
   * update instead of a network call). */
  const withSave = async (fn: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await fn();
      if (step === STEP_LABELS.length - 1) {
        toast.success("You're all set!");
        router.push("/dashboard");
      } else {
        setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
      }
    } catch (err) {
      toast.error("Couldn't save that step", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const skip = () => withSave(async () => {});

  /** The uploaded PDF is already saved to the Resume Vault by the API
   * route by this point — this just merges the parsed fields into the
   * steps that haven't mounted yet. Basic Info/Experience/Social Links
   * take the parsed values outright (a resume upload represents "start
   * from this"); skills/education only overwrite if the parse actually
   * found something, so a fallback-path empty array doesn't wipe out
   * data already saved from a previous onboarding attempt. */
  const handleResumeParsed = (_resumeId: string, profile: ParsedResumeProfile) =>
    withSave(async () => {
      setPrefill((prev) => ({
        ...prev,
        basicInfo: { ...prev.basicInfo, ...profile.basicInfo },
        experience: { ...prev.experience, ...profile.experience },
        skills: profile.skills.length > 0 ? profile.skills : prev.skills,
        education: profile.education.length > 0 ? profile.education : prev.education,
        socialLinks: { ...prev.socialLinks, ...profile.socialLinks },
      }));
    });

  const saveBasicInfo = (values: BasicInfoValues) =>
    withSave(async () => {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          email,
          full_name: values.full_name,
          phone: values.phone,
          city: values.city,
          bio: values.bio || null,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    });

  const saveExperience = (values: ExperienceValues) =>
    withSave(async () => {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          current_job_role: values.current_job_role || null,
          current_company: values.current_company || null,
          years_experience: values.years_experience,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    });

  const saveSkills = (skills: SkillValue[]) =>
    withSave(async () => {
      // Delete-then-reinsert: skills has no unique(user_id), so this is
      // what makes revisiting this step via Back safe to resubmit.
      const { error: deleteError } = await supabase.from("skills").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      if (skills.length > 0) {
        const { error: insertError } = await supabase
          .from("skills")
          .insert(skills.map((s) => ({ user_id: userId, name: s.name, level: s.level })));
        if (insertError) throw insertError;
      }
    });

  const saveEducation = (education: EducationEntryValues[]) =>
    withSave(async () => {
      const { error: deleteError } = await supabase.from("education").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      if (education.length > 0) {
        const { error: insertError } = await supabase.from("education").insert(
          education.map((e) => ({
            user_id: userId,
            institution: e.institution,
            degree: e.degree,
            field: e.field,
            start_date: `${e.start_year}-01-01`,
            end_date: e.end_year ? `${e.end_year}-01-01` : null,
            grade: e.grade || null,
          }))
        );
        if (insertError) throw insertError;
      }
    });

  const saveJobPreferences = (values: JobPreferencesValues) =>
    withSave(async () => {
      const { error } = await supabase.from("job_preferences").upsert(
        {
          user_id: userId,
          target_roles: values.target_roles,
          target_fields: values.target_fields,
          min_salary: values.min_salary ? Number(values.min_salary) : null,
          max_salary: values.max_salary ? Number(values.max_salary) : null,
          currency: values.currency,
          work_mode: values.work_mode ?? null,
          preferred_locations: values.preferred_locations,
          notice_period: values.notice_period || null,
          job_search_status: values.job_search_status,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    });

  const saveSocialLinks = (values: SocialLinksValues) =>
    withSave(async () => {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          linkedin_url: values.linkedin_url || null,
          github_url: values.github_url || null,
          portfolio_url: values.portfolio_url || null,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    });

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8">
        <ProgressBar steps={STEP_LABELS} currentStep={step} />
      </div>

      {/* No AnimatePresence / exit animation here on purpose. Two earlier
          attempts (direction-aware custom-prop variants with
          mode="wait"; then plain variants with mode="popLayout") both
          intermittently left the outgoing step frozen on screen at full
          opacity, overlapping the incoming one, indefinitely — React
          state (confirmed via direct inspection) advanced correctly
          every time, so the bug was specifically in exit-animation
          tracking, not step logic. Enter-only sidesteps that whole
          mechanism: changing `key` unmounts the old step immediately
          (a normal React unmount, no exit transition attempted) while
          the new one fades in. Costs the fade/slide-out on the way out;
          never gets stuck. */}
      <motion.div
        key={step}
        variants={stepVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {step === 0 && <StepResumeUpload onParsed={handleResumeParsed} onSkip={skip} />}
        {step === 1 && (
          <StepBasicInfo defaultValues={prefill.basicInfo} onNext={saveBasicInfo} isSaving={isSaving} />
        )}
        {step === 2 && (
          <StepExperience
            defaultValues={prefill.experience}
            onNext={saveExperience}
            onBack={goBack}
            onSkip={skip}
            isSaving={isSaving}
          />
        )}
        {step === 3 && (
          <StepSkills
            defaultValue={prefill.skills}
            onNext={saveSkills}
            onBack={goBack}
            isSaving={isSaving}
          />
        )}
        {step === 4 && (
          <StepEducation
            defaultValue={prefill.education}
            onNext={saveEducation}
            onBack={goBack}
            isSaving={isSaving}
          />
        )}
        {step === 5 && (
          <StepJobPreferences
            defaultValues={prefill.jobPreferences}
            onNext={saveJobPreferences}
            onBack={goBack}
            isSaving={isSaving}
          />
        )}
        {step === 6 && (
          <StepSocialLinks
            defaultValues={prefill.socialLinks}
            onNext={saveSocialLinks}
            onBack={goBack}
            onSkip={skip}
            isSaving={isSaving}
          />
        )}
      </motion.div>
    </div>
  );
}
