import Link from "next/link";
import { Briefcase, ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

export interface JobListingRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  apply_url: string | null;
}

export function JobsForYouCard({ jobs }: { jobs: JobListingRow[] }) {
  return (
    <div className="card-hover rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold text-foreground">Jobs for you</h3>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Run Radar to scan live listings and find your first matches."
          className="mt-4 py-10"
          action={
            <Link href="/dashboard/jobs" className={buttonVariants({ size: "sm", variant: "secondary" })}>
              Open Radar
            </Link>
          }
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors duration-fast hover:border-border-strong">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-secondary">
                {job.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
