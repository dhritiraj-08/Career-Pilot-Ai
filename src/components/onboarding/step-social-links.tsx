"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { socialLinksSchema, type SocialLinksValues } from "@/lib/validations/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepFooter } from "./step-footer";

interface StepSocialLinksProps {
  defaultValues: Partial<SocialLinksValues>;
  onNext: (values: SocialLinksValues) => void;
  onBack: () => void;
  onSkip: () => void;
  isSaving: boolean;
}

export function StepSocialLinks({
  defaultValues,
  onNext,
  onBack,
  onSkip,
  isSaving,
}: StepSocialLinksProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SocialLinksValues>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: { linkedin_url: "", github_url: "", portfolio_url: "", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5" noValidate>
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Social links</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All optional — you can always add these later.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="linkedin_url">LinkedIn</Label>
        <Input id="linkedin_url" placeholder="https://linkedin.com/in/..." {...register("linkedin_url")} />
        {errors.linkedin_url && <p className="text-xs text-destructive">{errors.linkedin_url.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="github_url">GitHub</Label>
        <Input id="github_url" placeholder="https://github.com/..." {...register("github_url")} />
        {errors.github_url && <p className="text-xs text-destructive">{errors.github_url.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="portfolio_url">Portfolio</Label>
        <Input id="portfolio_url" placeholder="https://..." {...register("portfolio_url")} />
        {errors.portfolio_url && <p className="text-xs text-destructive">{errors.portfolio_url.message}</p>}
      </div>
      <StepFooter onBack={onBack} onSkip={onSkip} isSaving={isSaving} isLastStep />
    </form>
  );
}
