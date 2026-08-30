"use client";

import * as React from "react";
import { X } from "lucide-react";

import { SKILL_LEVELS, type SkillValue } from "@/lib/validations/onboarding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const LEVEL_LABEL: Record<(typeof SKILL_LEVELS)[number], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface SkillsInputProps {
  value: SkillValue[];
  onChange: (value: SkillValue[]) => void;
}

export function SkillsInput({ value, onChange }: SkillsInputProps) {
  const [name, setName] = React.useState("");
  const [level, setLevel] = React.useState<(typeof SKILL_LEVELS)[number]>("intermediate");

  const addSkill = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setName("");
      return;
    }
    onChange([...value, { name: trimmed, level }]);
    setName("");
  };

  const removeSkill = (skillName: string) => {
    onChange(value.filter((s) => s.name !== skillName));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkill();
            }
          }}
          placeholder="e.g. React, Python, SQL"
          className="flex-1"
        />
        <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKILL_LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {LEVEL_LABEL[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={addSkill}>
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <span
              key={skill.name}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground"
            >
              {skill.name}
              <span className="text-muted-foreground">· {LEVEL_LABEL[skill.level]}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill.name)}
                className="text-muted-foreground transition-colors duration-fast hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
