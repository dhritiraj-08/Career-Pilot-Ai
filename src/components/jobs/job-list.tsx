"use client";

import * as React from "react";
import { Briefcase, Bookmark, CheckCircle2 } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import type { JobHunterResultItem } from "@/app/api/agents/job-hunter/route";
import { JobCard } from "./job-card";

type SortMode = "best" | "recent";
type FilterMode = "all" | "saved" | "applied";

interface JobListProps {
  jobs: JobHunterResultItem[];
  hasSearched: boolean;
  onStatusChange: (jobId: string, status: JobHunterResultItem["applicationStatus"]) => void;
}

export function JobList({ jobs, hasSearched, onStatusChange }: JobListProps) {
  const [sortMode, setSortMode] = React.useState<SortMode>("best");
  const [filterMode, setFilterMode] = React.useState<FilterMode>("all");

  const filtered = jobs.filter((job) => {
    if (filterMode === "saved") return job.applicationStatus === "saved";
    if (filterMode === "applied") return job.applicationStatus === "applied";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "recent") {
      const aTime = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const bTime = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return bTime - aTime;
    }
    return b.score - a.score;
  });

  if (!hasSearched) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Ready when you are"
        description='Set your filters and click "Find Jobs" to search live listings from RemoteOK and WeWorkRemotely.'
        className="py-20"
      />
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No jobs found right now, try again later"
        description="RemoteOK and WeWorkRemotely didn't return any listings for this search. Try broadening your filters."
        className="py-20"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <TabsList>
            <TabsTrigger value="best">Best Match</TabsTrigger>
            <TabsTrigger value="recent">Most Recent</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={filterMode === "saved" ? Bookmark : CheckCircle2}
          title={filterMode === "saved" ? "No saved jobs yet" : "No applications yet"}
          description={
            filterMode === "saved"
              ? "Bookmark a job with \"Save Job\" to keep track of it here."
              : "Jobs you apply to will show up here."
          }
          className="py-16"
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((job) => (
            <JobCard key={job.id} job={job} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
