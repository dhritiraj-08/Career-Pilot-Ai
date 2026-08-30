"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { socialLinksSchema, type SocialLinksValues } from "@/lib/validations/onboarding";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "./section-card";
import { ReadField } from "./read-field";

interface LinksTabProps {
  userId: string;
  initial: SocialLinksValues;
  onSaved: (values: SocialLinksValues) => void;
}

export function LinksTab({ userId, initial, onSaved }: LinksTabProps) {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SocialLinksValues>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: SocialLinksValues) => {
    setIsSaving(true);
    try {
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
      toast.success("Links updated");
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
      title="Social links"
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
            <Label>LinkedIn</Label>
            <Input {...register("linkedin_url")} placeholder="https://linkedin.com/in/..." />
            {errors.linkedin_url && <p className="text-xs text-destructive">{errors.linkedin_url.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>GitHub</Label>
            <Input {...register("github_url")} placeholder="https://github.com/..." />
            {errors.github_url && <p className="text-xs text-destructive">{errors.github_url.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Portfolio</Label>
            <Input {...register("portfolio_url")} placeholder="https://..." />
            {errors.portfolio_url && <p className="text-xs text-destructive">{errors.portfolio_url.message}</p>}
          </div>
        </div>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-3">
          <ReadField label="LinkedIn" value={initial.linkedin_url || "—"} />
          <ReadField label="GitHub" value={initial.github_url || "—"} />
          <ReadField label="Portfolio" value={initial.portfolio_url || "—"} />
        </dl>
      )}
    </SectionCard>
  );
}
