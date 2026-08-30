"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  jobPreferencesSchema,
  type JobPreferencesValues,
  WORK_MODES,
  NOTICE_PERIODS,
  JOB_SEARCH_STATUSES,
} from "@/lib/validations/onboarding";
import { createClient } from "@/lib/supabase/client";
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
import { SectionCard } from "./section-card";
import { ReadField } from "./read-field";

const WORK_MODE_LABEL: Record<(typeof WORK_MODES)[number], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

interface PreferencesTabProps {
  userId: string;
  initial: JobPreferencesValues;
  onSaved: (values: JobPreferencesValues) => void;
}

export function PreferencesTab({ userId, initial, onSaved }: PreferencesTabProps) {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<JobPreferencesValues>({
    resolver: zodResolver(jobPreferencesSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: JobPreferencesValues) => {
    setIsSaving(true);
    try {
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
      toast.success("Preferences updated");
      onSaved(values);
      setIsEditing(false);
    } catch (err) {
      toast.error("Couldn't save", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard
      title="Job preferences"
      isEditing={isEditing}
      isSaving={isSaving}
      onEdit={() => setIsEditing(true)}
      onCancel={() => {
        reset(initial);
        setIsEditing(false);
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Target roles</Label>
            <Controller
              control={control}
              name="target_roles"
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
            />
            {errors.target_roles && (
              <p className="text-xs text-destructive">{errors.target_roles.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Target fields</Label>
            <Controller
              control={control}
              name="target_fields"
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
            />
            {errors.target_fields && (
              <p className="text-xs text-destructive">{errors.target_fields.message}</p>
            )}
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
              <Input type="number" {...register("min_salary")} />
            </div>
            <div className="space-y-2">
              <Label>Max salary</Label>
              <Input type="number" {...register("max_salary")} />
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
                          : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
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
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
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
        </div>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2">
          <ReadField label="Target roles" value={initial.target_roles.join(", ") || "—"} />
          <ReadField label="Target fields" value={initial.target_fields.join(", ") || "—"} />
          <ReadField
            label="Salary range"
            value={
              initial.min_salary || initial.max_salary
                ? `${initial.currency} ${initial.min_salary || "?"} – ${initial.max_salary || "?"}`
                : "—"
            }
          />
          <ReadField label="Work mode" value={initial.work_mode ? WORK_MODE_LABEL[initial.work_mode] : "—"} />
          <ReadField label="Preferred locations" value={initial.preferred_locations.join(", ") || "—"} />
          <ReadField label="Notice period" value={initial.notice_period || "—"} />
          <ReadField
            label="Job search status"
            value={JOB_SEARCH_STATUSES.find((s) => s.value === initial.job_search_status)?.label ?? "—"}
          />
        </dl>
      )}
    </SectionCard>
  );
}
