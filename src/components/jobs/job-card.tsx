"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, Check, ChevronDown, ExternalLink, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { setResumeArchitectPrefill } from "@/lib/job-handoff";
import { upsertJobApplication, removeJobApplication } from "@/lib/job-applications";
import type { JobHunterResultItem } from "@/app/api/agents/job-hunter/route";

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };

function formatSalary(job: JobHunterResultItem): string | null {
  if (job.salaryMin == null && job.salaryMax == null) return null;
  const symbol = CURRENCY_SYMBOL[job.currency] ?? `${job.currency} `;
  const fmt = (n: number) => `${symbol}${n.toLocaleString()}`;
  if (job.salaryMin != null && job.salaryMax != null) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
  return fmt(job.salaryMin ?? job.salaryMax ?? 0);
}

function scoreBadgeClasses(score: number): string {
  if (score >= 75) return "bg-success/15 text-success";
  if (score >= 50) return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

interface JobCardProps {
  job: JobHunterResultItem;
  onStatusChange: (jobId: string, status: JobHunterResultItem["applicationStatus"]) => void;
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [expanded, setExpanded] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const salary = formatSalary(job);
  const posted = timeAgo(job.postedAt);
  const isSaved = job.applicationStatus === "saved";
  const isApplied = job.applicationStatus === "applied" || Boolean(job.applicationStatus && job.applicationStatus !== "saved");

  const handleSaveToggle = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      if (isSaved) {
        await removeJobApplication(supabase, user.id, job.id);
        onStatusChange(job.id, null);
        toast.success("Removed from saved jobs");
      } else {
        await upsertJobApplication(supabase, user.id, job.id, {
          status: "saved",
          match_score: job.score,
          missing_skills: job.missingSkills,
        });
        onStatusChange(job.id, "saved");
        toast.success("Job saved");
      }
    } catch (err) {
      toast.error("Couldn't update saved jobs", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = async () => {
    if (job.applyUrl) window.open(job.applyUrl, "_blank", "noopener,noreferrer");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await upsertJobApplication(supabase, user.id, job.id, {
        status: "applied",
        applied_at: new Date().toISOString(),
        match_score: job.score,
        missing_skills: job.missingSkills,
      });
      onStatusChange(job.id, "applied");
    } catch (err) {
      console.error("[job-hunter] failed to record application:", err);
    }
  };

  const handleBuildResume = () => {
    setResumeArchitectPrefill({
      jobDescription: job.description ?? `${job.title} at ${job.company}`,
      targetRole: job.title,
    });
    router.push("/dashboard/resume-architect");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold text-foreground">{job.title}</p>
          <p className="truncate text-sm text-muted-foreground">{job.company}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {job.location ?? "Remote"}
            </span>
            <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-foreground">Remote</span>
            {posted && <span>· {posted}</span>}
          </div>
          {salary && <p className="mt-2 text-sm font-medium text-foreground">{salary}</p>}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-sm font-semibold",
            scoreBadgeClasses(job.score)
          )}
        >
          {job.score}% match
        </span>
      </div>

      {job.missingSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.missingSkills.slice(0, 6).map((skill) => (
            <span key={skill} className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs text-destructive">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
          View Details
          <ChevronDown className={cn("ml-1.5 h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isSaving || isApplied} onClick={handleSaveToggle}>
          {isSaved ? <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" /> : <Bookmark className="mr-1.5 h-3.5 w-3.5" />}
          {isSaved ? "Saved" : "Save Job"}
        </Button>
        <Button type="button" size="sm" disabled={!job.applyUrl} onClick={handleApply}>
          {isApplied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <ExternalLink className="mr-1.5 h-3.5 w-3.5" />}
          {isApplied ? "Applied" : "Apply"}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          {job.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Full description
              </h4>
              <p className="mt-1.5 whitespace-pre-line text-sm text-foreground">{job.description}</p>
            </div>
          )}

          {job.matchReasons.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why this matches your profile
              </h4>
              <ul className="mt-1.5 space-y-1 text-sm text-foreground">
                {job.matchReasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <span className="text-secondary">•</span> {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills you have
              </h4>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {job.matchedSkills.length > 0 ? (
                  job.matchedSkills.map((skill) => (
                    <span key={skill} className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs text-success">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No overlap found with this listing.</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills you need
              </h4>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {job.missingSkills.length > 0 ? (
                  job.missingSkills.map((skill) => (
                    <span key={skill} className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs text-destructive">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">None identified.</p>
                )}
              </div>
            </div>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={handleBuildResume}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Build Resume for This Job
          </Button>
        </div>
      )}
    </div>
  );
}
