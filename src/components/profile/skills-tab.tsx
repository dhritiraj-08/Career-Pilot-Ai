"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
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

export interface SkillRow extends SkillValue {
  id: string;
}

const LEVEL_LABEL: Record<(typeof SKILL_LEVELS)[number], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface SkillsTabProps {
  userId: string;
  initial: SkillRow[];
  onChange: (skills: SkillRow[]) => void;
}

/** Unlike onboarding's SkillsInput (deferred, bulk-save on wizard Next),
 * every add/remove here persists immediately — this is a live settings
 * page, not a wizard step. */
export function SkillsTab({ userId, initial, onChange }: SkillsTabProps) {
  const supabase = createClient();
  const [skills, setSkills] = React.useState<SkillRow[]>(initial);
  const [name, setName] = React.useState("");
  const [level, setLevel] = React.useState<(typeof SKILL_LEVELS)[number]>("intermediate");
  const [isAdding, setIsAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const addSkill = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Already added");
      return;
    }
    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from("skills")
        .insert({ user_id: userId, name: trimmed, level })
        .select("id, name, level")
        .single();
      if (error) throw error;
      const next = [...skills, data as SkillRow];
      setSkills(next);
      onChange(next);
      setName("");
    } catch (err) {
      toast.error("Couldn't add skill", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeSkill = async (id: string) => {
    setRemovingId(id);
    try {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;
      const next = skills.filter((s) => s.id !== id);
      setSkills(next);
      onChange(next);
    } catch (err) {
      toast.error("Couldn't remove skill", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold text-foreground">Skills</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Changes save immediately.</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkill();
            }
          }}
          placeholder="e.g. React"
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
        <Button type="button" onClick={addSkill} disabled={isAdding}>
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
        </Button>
      </div>

      {skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground"
            >
              {skill.name}
              <span className="text-muted-foreground">· {LEVEL_LABEL[skill.level]}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                disabled={removingId === skill.id}
                className="text-muted-foreground transition-colors duration-fast hover:text-destructive"
              >
                {removingId === skill.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No skills added yet.</p>
      )}
    </div>
  );
}
