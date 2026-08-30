"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { experienceSchema, type ExperienceValues } from "@/lib/validations/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { StepFooter } from "./step-footer";

interface StepExperienceProps {
  defaultValues: Partial<ExperienceValues>;
  onNext: (values: ExperienceValues) => void;
  onBack: () => void;
  onSkip: () => void;
  isSaving: boolean;
}

export function StepExperience({
  defaultValues,
  onNext,
  onBack,
  onSkip,
  isSaving,
}: StepExperienceProps) {
  const { register, handleSubmit, control, watch } = useForm<ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      current_job_role: "",
      current_company: "",
      years_experience: 0,
      ...defaultValues,
    },
  });

  const years = watch("years_experience");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5" noValidate>
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Your experience</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All optional — skip if you&apos;re just starting out.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="current_job_role">
          Current role <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="current_job_role" placeholder="Frontend Developer" {...register("current_job_role")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="current_company">
          Current company <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="current_company" placeholder="Acme Corp" {...register("current_company")} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Years of experience</Label>
          <span className="font-heading text-sm font-semibold text-secondary">{years}</span>
        </div>
        <Controller
          control={control}
          name="years_experience"
          render={({ field }) => (
            <Slider min={0} max={20} step={1} value={field.value} onChange={field.onChange} />
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>20+</span>
        </div>
      </div>
      <StepFooter onBack={onBack} onSkip={onSkip} isSaving={isSaving} />
    </form>
  );
}
