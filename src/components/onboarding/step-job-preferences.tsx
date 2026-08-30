"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  jobPreferencesSchema,
  type JobPreferencesValues,
  WORK_MODES,
  NOTICE_PERIODS,
  JOB_SEARCH_STATUSES,
} from "@/lib/validations/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StepFooter } from "./step-footer";

const WORK_MODE_LABEL: Record<(typeof WORK_MODES)[number], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

interface StepJobPreferencesProps {
  defaultValues: Partial<JobPreferencesValues>;
  onNext: (values: JobPreferencesValues) => void;
  onBack: () => void;
  isSaving: boolean;
}

export function StepJobPreferences({
  defaultValues,
  onNext,
  onBack,
  isSaving,
}: StepJobPreferencesProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<JobPreferencesValues>({
    resolver: zodResolver(jobPreferencesSchema),
    defaultValues: {
      target_roles: [],
      target_fields: [],
      currency: "INR",
      preferred_locations: [],
      job_search_status: "active",
      notice_period: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5" noValidate>
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Job preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Helps the Job Hunter agent match you to the right roles.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Target roles</Label>
        <Controller
          control={control}
          name="target_roles"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} placeholder="SDE, Product Analyst..." />
          )}
        />
        {errors.target_roles && <p className="text-xs text-destructive">{errors.target_roles.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Target fields</Label>
        <Controller
          control={control}
          name="target_fields"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} placeholder="Fintech, EdTech..." />
          )}
        />
        {errors.target_fields && <p className="text-xs text-destructive">{errors.target_fields.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Min salary</Label>
          <Input type="number" placeholder="600000" {...register("min_salary")} />
        </div>
        <div className="space-y-2">
          <Label>Max salary</Label>
          <Input type="number" placeholder="1200000" {...register("max_salary")} />
        </div>
      </div>
      {errors.max_salary && <p className="text-xs text-destructive">{errors.max_salary.message}</p>}

      <div className="space-y-2">
        <Label>Work mode</Label>
        <Controller
          control={control}
          name="work_mode"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {WORK_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => field.onChange(mode)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-fast",
                    field.value === mode
                      ? "border-transparent bg-gradient-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {WORK_MODE_LABEL[mode]}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Preferred locations</Label>
        <Controller
          control={control}
          name="preferred_locations"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} placeholder="Bengaluru, Remote..." />
          )}
        />
        {errors.preferred_locations && (
          <p className="text-xs text-destructive">{errors.preferred_locations.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Notice period</Label>
          <Controller
            control={control}
            name="notice_period"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_PERIODS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Job search status</Label>
          <Controller
            control={control}
            name="job_search_status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_SEARCH_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <StepFooter onBack={onBack} isSaving={isSaving} />
    </form>
  );
}
