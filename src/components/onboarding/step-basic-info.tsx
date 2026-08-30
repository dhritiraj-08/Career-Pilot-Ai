"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { basicInfoSchema, type BasicInfoValues } from "@/lib/validations/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepFooter } from "./step-footer";

interface StepBasicInfoProps {
  defaultValues: Partial<BasicInfoValues>;
  onNext: (values: BasicInfoValues) => void;
  isSaving: boolean;
}

export function StepBasicInfo({ defaultValues, onNext, isSaving }: StepBasicInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { full_name: "", phone: "", city: "", bio: "", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5" noValidate>
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Basic info</h2>
        <p className="mt-1 text-sm text-muted-foreground">Let&apos;s start with the essentials.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" placeholder="Aditi Sharma" autoFocus {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" type="tel" placeholder="+91 98765 43210" {...register("phone")} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" placeholder="Bengaluru" {...register("city")} />
        {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">
          Bio <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="bio" placeholder="A couple of lines about you" {...register("bio")} />
        {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
      </div>
      <StepFooter isSaving={isSaving} />
    </form>
  );
}
