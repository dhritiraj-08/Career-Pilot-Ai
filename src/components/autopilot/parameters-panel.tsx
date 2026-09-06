"use client";

import * as React from "react";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  AUTO_SCHEDULES,
  MIN_MATCH_SCORE_BOUNDS,
  MAX_APPLICATIONS_BOUNDS,
  type AutopilotSettingsRow,
  type AutoSchedule,
} from "@/lib/validations/autopilot";

const SCHEDULE_LABELS: Record<AutoSchedule, string> = {
  manual: "Manual",
  daily: "Daily",
  weekly: "Weekly",
};

interface ParametersPanelProps {
  settings: AutopilotSettingsRow;
  targetRoles: string[];
  workMode: string | null;
  isSaving: boolean;
  onSave: (next: AutopilotSettingsRow) => void;
}

export function ParametersPanel({ settings, targetRoles, workMode, isSaving, onSave }: ParametersPanelProps) {
  const [minMatchScore, setMinMatchScore] = React.useState(settings.min_match_score);
  const [maxApplicationsPerDay, setMaxApplicationsPerDay] = React.useState(settings.max_applications_per_day);
  const [autoSchedule, setAutoSchedule] = React.useState<AutoSchedule>(settings.auto_schedule);

  const isDirty =
    minMatchScore !== settings.min_match_score ||
    maxApplicationsPerDay !== settings.max_applications_per_day ||
    autoSchedule !== settings.auto_schedule;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-heading text-sm font-semibold text-foreground">Parameters</h2>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Minimum match score</Label>
            <span className="text-sm font-medium text-foreground">{minMatchScore}%</span>
          </div>
          <Slider
            min={MIN_MATCH_SCORE_BOUNDS.min}
            max={MIN_MATCH_SCORE_BOUNDS.max}
            step={5}
            value={minMatchScore}
            onChange={setMinMatchScore}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Max applications per day</Label>
            <span className="text-sm font-medium text-foreground">{maxApplicationsPerDay}</span>
          </div>
          <Slider
            min={MAX_APPLICATIONS_BOUNDS.min}
            max={MAX_APPLICATIONS_BOUNDS.max}
            step={1}
            value={maxApplicationsPerDay}
            onChange={setMaxApplicationsPerDay}
          />
        </div>

        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Auto-run schedule</Label>
          <div className="grid grid-cols-3 gap-2">
            {AUTO_SCHEDULES.map((schedule) => (
              <button
                key={schedule}
                type="button"
                onClick={() => setAutoSchedule(schedule)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors duration-fast",
                  autoSchedule === schedule
                    ? "border-transparent bg-gradient-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                )}
              >
                {SCHEDULE_LABELS[schedule]}
              </button>
            ))}
          </div>
          {autoSchedule !== "manual" && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Saved as a preference — actually triggering {SCHEDULE_LABELS[autoSchedule].toLowerCase()} runs on their own needs a
              scheduler configured on wherever this app is deployed. Click Run Career Autopilot any time to run it now regardless.
            </p>
          )}
        </div>

        <div className="border-t border-border pt-4 text-xs">
          <p className="text-muted-foreground">
            Target roles: <span className="text-foreground">{targetRoles.length > 0 ? targetRoles.join(", ") : "Not set"}</span>
          </p>
          <p className="mt-1 text-muted-foreground">
            Work mode: <span className="text-foreground">{workMode ?? "Not set"}</span>
          </p>
          <p className="mt-1 text-muted-foreground">
            Pulled from your <a href="/dashboard/profile" className="text-primary hover:underline">job preferences</a> — edit them there.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={!isDirty || isSaving}
          onClick={() => onSave({ min_match_score: minMatchScore, max_applications_per_day: maxApplicationsPerDay, auto_schedule: autoSchedule })}
        >
          {isSaving ? "Saving..." : "Save Parameters"}
        </Button>
      </div>
    </div>
  );
}
