"use client";

import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import type { EmailRow } from "@/lib/validations/email";
import { EmailListItem } from "./email-list-item";

interface EmailListProps {
  emails: EmailRow[];
  isConnected: boolean;
  onArchived: (emailId: string) => void;
  onSent: () => void;
}

export function EmailList({ emails, isConnected, onArchived, onSent }: EmailListProps) {
  if (!isConnected) {
    return (
      <EmptyState
        icon={Inbox}
        title="Connect Gmail to get started"
        description="Once connected, Sync Now to pull in your job-related emails."
        className="py-16"
      />
    );
  }

  if (emails.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No emails in this category"
        description="Try Sync Now to check for new job-related emails, or pick a different category."
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => (
        <EmailListItem key={email.id} email={email} onArchived={onArchived} onSent={onSent} />
      ))}
    </div>
  );
}
