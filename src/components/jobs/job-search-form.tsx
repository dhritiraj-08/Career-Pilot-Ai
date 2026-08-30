"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSteps } from "@/components/shared/loading-steps";
import { cn } from "@/lib/utils";

export type WorkMode = "remote" | "hybrid" | "onsite";

export interface JobSearchFilters {
  workModes: WorkMode[];
  location: string;
  role: string;
  minSalary: string;
}

const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

const SEARCH_STEPS = [
  "Searching RemoteOK...",
  "Searching WeWorkRemotely...",
  "Matching with your profile...",
  "Scoring opportunities...",
];

interface JobSearchFormProps {
  defaultFilters: JobSearchFilters;
  isLoading: boolean;
  onSearch: (filters: JobSearchFilters) => void;
}

export function JobSearchForm({ defaultFilters, isLoading, onSearch }: JobSearchFormProps) {
  const [filters, setFilters] = React.useState<JobSearchFilters>(defaultFilters);

  const toggleWorkMode = (mode: WorkMode) => {
    setFilters((prev) => ({
      ...prev,
      workModes: prev.workModes.includes(mode)
        ? prev.workModes.filter((m) => m !== mode)
        : [...prev.workModes, mode],
    }));
  };

  return (
    <div className="space-y-5 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Job Hunter</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search live remote listings and see how well each one matches your profile.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Work mode</Label>
        <div className="grid grid-cols-3 gap-2">
          {WORK_MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleWorkMode(opt.value)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-fast",
                filters.workModes.includes(opt.value)
                  ? "border-transparent bg-gradient-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobRole">Role</Label>
        <Input
          id="jobRole"
          placeholder="e.g. Frontend Engineer"
          value={filters.role}
          onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobLocation">Location</Label>
        <Input
          id="jobLocation"
          placeholder="e.g. India, Bengaluru"
          value={filters.location}
          onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="minSalary">Minimum salary</Label>
        <Input
          id="minSalary"
          type="number"
          min={0}
          placeholder="e.g. 1200000"
          value={filters.minSalary}
          onChange={(e) => setFilters((prev) => ({ ...prev, minSalary: e.target.value }))}
        />
      </div>

      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={isLoading}
        onClick={() => onSearch(filters)}
      >
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? "Searching..." : "Find Jobs"}
      </Button>

      {isLoading && <LoadingSteps steps={SEARCH_STEPS} compact />}
    </div>
  );
}
