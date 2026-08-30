import { Briefcase, ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export interface JobListingRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  apply_url: string | null;
}

export function JobsForYouCard({ jobs }: { jobs: JobListingRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold text-foreground">Jobs for you</h3>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="The Job Hunter agent will start surfacing matches here once it's live."
          className="mt-4 py-10"
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                </div>
                {job.apply_url && (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground transition-colors duration-fast hover:text-secondary"
                    aria-label="Open listing"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
