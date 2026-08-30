"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
import { ProgressBar } from "./progress-bar";
import { StepBasicInfo } from "./step-basic-info";
import { StepExperience } from "./step-experience";
import { StepSkills } from "./step-skills";
import { StepEducation } from "./step-education";
import { StepJobPreferences } from "./step-job-preferences";
import { StepSocialLinks } from "./step-social-links";

const STEP_LABELS = [
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

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function OnboardingWizard({ userId, email, initialData }: OnboardingWizardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [isSaving, setIsSaving] = React.useState(false);

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  /** Runs a Supabase write, then advances to the next step — or, on the
   * final step, redirects to /dashboard. Shared by every step's save
   * (and by Skip, which just passes a no-op). */
  const withSave = async (fn: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await fn();
      setDirection(1);
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

  const skip = () => withSave(async () => {});

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8">
        <ProgressBar steps={STEP_LABELS} currentStep={step} />
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {step === 0 && (
            <StepBasicInfo defaultValues={initialData.basicInfo} onNext={saveBasicInfo} isSaving={isSaving} />
          )}
          {step === 1 && (
            <StepExperience
              defaultValues={initialData.experience}
              onNext={saveExperience}
              onBack={goBack}
              onSkip={skip}
              isSaving={isSaving}
            />
          )}
          {step === 2 && (
            <StepSkills
              defaultValue={initialData.skills}
              onNext={saveSkills}
              onBack={goBack}
              isSaving={isSaving}
            />
          )}
          {step === 3 && (
            <StepEducation
              defaultValue={initialData.education}
              onNext={saveEducation}
              onBack={goBack}
              isSaving={isSaving}
            />
          )}
          {step === 4 && (
            <StepJobPreferences
              defaultValues={initialData.jobPreferences}
              onNext={saveJobPreferences}
              onBack={goBack}
              isSaving={isSaving}
            />
          )}
          {step === 5 && (
            <StepSocialLinks
              defaultValues={initialData.socialLinks}
              onNext={saveSocialLinks}
              onBack={goBack}
              onSkip={skip}
              isSaving={isSaving}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
