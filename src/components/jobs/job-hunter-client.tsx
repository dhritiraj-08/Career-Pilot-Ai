"use client";

import * as React from "react";
import { toast } from "sonner";

import type { JobHunterResultItem } from "@/app/api/agents/job-hunter/route";
import { JobSearchForm, type JobSearchFilters } from "./job-search-form";
import { JobList } from "./job-list";

interface JobHunterClientProps {
  defaultFilters: JobSearchFilters;
}

export function JobHunterClient({ defaultFilters }: JobHunterClientProps) {
  const [jobs, setJobs] = React.useState<JobHunterResultItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const handleSearch = async (filters: JobSearchFilters) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agents/job-hunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workModes: filters.workModes,
          location: filters.location,
          role: filters.role,
          minSalary: filters.minSalary ? Number(filters.minSalary) : null,
          indiaFriendlyOnly: filters.indiaFriendlyOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setJobs(data.jobs ?? []);
      setHasSearched(true);
      if ((data.jobs ?? []).length === 0) {
        toast.info("No jobs found right now, try again later.");
      } else {
        toast.success(`Found ${data.jobs.length} job${data.jobs.length === 1 ? "" : "s"}`);
      }
    } catch (err) {
      toast.error("Couldn't search jobs", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (jobId: string, status: JobHunterResultItem["applicationStatus"]) => {
    setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, applicationStatus: status } : job)));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <JobSearchForm defaultFilters={defaultFilters} isLoading={isLoading} onSearch={handleSearch} />
      </div>
      <JobList jobs={jobs} hasSearched={hasSearched} onStatusChange={handleStatusChange} />
    </div>
  );
}
