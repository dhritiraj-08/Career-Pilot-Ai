"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { overviewSchema, type OverviewValues } from "@/lib/validations/profile";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { SectionCard } from "./section-card";
import { ReadField } from "./read-field";

interface OverviewTabProps {
  userId: string;
  initial: OverviewValues;
  onSaved: (values: OverviewValues) => void;
}

export function OverviewTab({ userId, initial, onSaved }: OverviewTabProps) {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<OverviewValues>({
    resolver: zodResolver(overviewSchema),
    defaultValues: initial,
  });

  const years = watch("years_experience");

  const onSubmit = async (values: OverviewValues) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          full_name: values.full_name,
          phone: values.phone,
          city: values.city,
          bio: values.bio || null,
          current_job_role: values.current_job_role || null,
          current_company: values.current_company || null,
          years_experience: values.years_experience,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
      toast.success("Profile updated");
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
      title="Basic info & experience"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>
                Current role <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input {...register("current_job_role")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>
                Current company <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input {...register("current_company")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              Bio <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea {...register("bio")} />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Years of experience</Label>
              <span className="text-sm font-semibold text-secondary">{years}</span>
            </div>
            <Controller
              control={control}
              name="years_experience"
              render={({ field }) => (
                <Slider min={0} max={20} step={1} value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2">
          <ReadField label="Full name" value={initial.full_name} />
          <ReadField label="Phone" value={initial.phone} />
          <ReadField label="City" value={initial.city} />
          <ReadField label="Current role" value={initial.current_job_role || "—"} />
          <ReadField label="Current company" value={initial.current_company || "—"} />
          <ReadField label="Years of experience" value={String(initial.years_experience)} />
          <div className="sm:col-span-2">
            <ReadField label="Bio" value={initial.bio || "—"} />
          </div>
        </dl>
      )}
    </SectionCard>
  );
}
