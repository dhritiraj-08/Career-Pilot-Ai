"use client";

import * as React from "react";

import { skillsStepSchema, type SkillValue } from "@/lib/validations/onboarding";
import { SkillsInput } from "./skills-input";
import { StepFooter } from "./step-footer";

interface StepSkillsProps {
  defaultValue: SkillValue[];
  onNext: (skills: SkillValue[]) => void;
  onBack: () => void;
  isSaving: boolean;
}

export function StepSkills({ defaultValue, onNext, onBack, isSaving }: StepSkillsProps) {
  const [skills, setSkills] = React.useState<SkillValue[]>(defaultValue);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = skillsStepSchema.safeParse({ skills });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Add at least one skill");
      return;
    }
    setError(null);
    onNext(skills);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Your skills</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the skills you want to be matched on.
        </p>
      </div>
      <SkillsInput value={skills} onChange={setSkills} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <StepFooter onBack={onBack} isSaving={isSaving} />
    </form>
  );
}
