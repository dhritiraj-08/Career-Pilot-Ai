"use client";

import { Briefcase, CalendarCheck, Inbox, Mail, ThumbsDown, Trophy, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EmailRow } from "@/lib/validations/email";
import type { DailyDigest } from "@/lib/email-digest";

export type CategoryFilter =
  | "all"
  | "application"
  | "recruiter_outreach"
  | "interview_invite"
  | "offer"
  | "rejection"
  | "follow_up_needed";

interface CategoryDef {
  key: CategoryFilter;
  label: string;
  icon: typeof Mail;
}

const CATEGORIES: CategoryDef[] = [
  { key: "application", label: "Job Applications", icon: Briefcase },
  { key: "recruiter_outreach", label: "Recruiter Emails", icon: Users },
  { key: "interview_invite", label: "Interview Invites", icon: CalendarCheck },
  { key: "offer", label: "Offer Letters", icon: Trophy },
  { key: "rejection", label: "Rejections", icon: ThumbsDown },
  { key: "follow_up_needed", label: "Follow-ups Needed", icon: Mail },
  { key: "all", label: "All Job Emails", icon: Inbox },
];

function countFor(key: CategoryFilter, emails: EmailRow[], digest: DailyDigest): number {
  if (key === "all") return emails.length;
  if (key === "follow_up_needed") return digest.followUpsNeeded;
  return emails.filter((e) => e.type === key).length;
}

interface EmailCategoryPanelProps {
  emails: EmailRow[];
  digest: DailyDigest;
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}

export function EmailCategoryPanel({ emails, digest, selected, onSelect }: EmailCategoryPanelProps) {
  return (
    <nav className="space-y-1 rounded-lg border border-border bg-card p-2">
      {CATEGORIES.map((cat) => {
        const count = countFor(cat.key, emails, digest);
        const isActive = selected === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelect(cat.key)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast",
              isActive ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <cat.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{cat.label}</span>
            </span>
            {count > 0 && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive ? "bg-white/20 text-primary-foreground" : "bg-accent text-foreground"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
