"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { educationStepSchema, type EducationEntryValues } from "@/lib/validations/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StepFooter } from "./step-footer";

const emptyEntry: EducationEntryValues = {
  institution: "",
  degree: "",
  field: "",
  start_year: new Date().getFullYear(),
  end_year: undefined,
  grade: "",
};

interface StepEducationProps {
  defaultValue: EducationEntryValues[];
  onNext: (education: EducationEntryValues[]) => void;
  onBack: () => void;
  isSaving: boolean;
}

export function StepEducation({ defaultValue, onNext, onBack, isSaving }: StepEducationProps) {
  const [entries, setEntries] = React.useState<EducationEntryValues[]>(
    defaultValue.length > 0 ? defaultValue : [emptyEntry]
  );
  const [error, setError] = React.useState<string | null>(null);

  const updateEntry = (index: number, patch: Partial<EducationEntryValues>) => {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = educationStepSchema.safeParse({ education: entries });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your education entries");
      return;
    }
    setError(null);
    onNext(parsed.data.education);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Education</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add your degrees, most recent first.</p>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={index} className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Entry {index + 1}</span>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="text-muted-foreground transition-colors duration-fast hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                value={entry.institution}
                onChange={(e) => updateEntry(index, { institution: e.target.value })}
                placeholder="Delhi University"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input
                  value={entry.degree}
                  onChange={(e) => updateEntry(index, { degree: e.target.value })}
                  placeholder="B.Tech"
                />
              </div>
              <div className="space-y-2">
                <Label>Field</Label>
                <Input
                  value={entry.field}
                  onChange={(e) => updateEntry(index, { field: e.target.value })}
                  placeholder="Computer Science"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Start year</Label>
                <Input
                  type="number"
                  value={entry.start_year}
                  onChange={(e) => updateEntry(index, { start_year: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>End year</Label>
                <Input
                  type="number"
                  value={entry.end_year ?? ""}
                  onChange={(e) =>
                    updateEntry(index, {
                      end_year: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Input
                  value={entry.grade}
                  onChange={(e) => updateEntry(index, { grade: e.target.value })}
                  placeholder="8.5 CGPA"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setEntries((prev) => [...prev, { ...emptyEntry }])}
      >
        <Plus className="mr-2 h-4 w-4" /> Add another
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <StepFooter onBack={onBack} isSaving={isSaving} />
    </form>
  );
}
