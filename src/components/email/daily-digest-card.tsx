"use client";

import { AlertCircle, Briefcase, MailOpen, ThumbsDown, Users } from "lucide-react";

import type { DailyDigest } from "@/lib/email-digest";

const CATEGORY_LABEL: Record<string, string> = {
  recruiter_outreach: "Recruiter email",
  interview_invite: "Interview invite",
  offer: "Offer",
};

interface DailyDigestCardProps {
  digest: DailyDigest;
  onSelectEmail: (emailId: string) => void;
}

export function DailyDigestCard({ digest, onSelectEmail }: DailyDigestCardProps) {
  const stats = [
    { label: "New recruiter emails", value: digest.newRecruiterEmails, icon: Users },
    { label: "Interview invites", value: digest.interviewInvites, icon: Briefcase },
    { label: "Rejections", value: digest.rejections, icon: ThumbsDown },
    { label: "Follow-ups needed", value: digest.followUpsNeeded, icon: MailOpen },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-heading text-base font-semibold text-foreground">Today&apos;s Digest</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md bg-background p-3">
            <s.icon className="h-4 w-4 text-secondary" />
            <p className="mt-2 font-heading text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {digest.actionRequired.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-warning" /> Action required
          </h3>
          <ul className="space-y-1.5">
            {digest.actionRequired.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectEmail(item.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-fast hover:bg-accent"
                >
                  <span className="min-w-0 truncate text-foreground">{item.subject}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {CATEGORY_LABEL[item.category] ?? item.category} · {item.sender}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
