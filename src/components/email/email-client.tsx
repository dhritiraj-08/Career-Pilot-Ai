"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmailRow } from "@/lib/validations/email";
import type { DailyDigest } from "@/lib/email-digest";
import { GmailConnectionBar } from "./gmail-connection-bar";
import { DailyDigestCard } from "./daily-digest-card";
import { EmailCategoryPanel, type CategoryFilter } from "./email-category-panel";
import { EmailList } from "./email-list";
import { ComposeEmailModal } from "./compose-email-modal";

export interface ComposeResumeOption {
  id: string;
  name: string;
  is_primary: boolean;
}

interface EmailClientProps {
  connectedEmail: string | null;
  initialEmails: EmailRow[];
  initialDigest: DailyDigest;
  resumes: ComposeResumeOption[];
}

const CONNECT_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Gmail connection was cancelled.",
  invalid_state: "That connection attempt expired — try again.",
  connect_failed: "Couldn't connect Gmail — please try again.",
  storage_failed: "Connected, but couldn't save the connection — please try again.",
  gmail_not_configured: "Gmail isn't configured on this server yet.",
};

export function EmailClient({ connectedEmail, initialEmails, initialDigest, resumes }: EmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emails, setEmails] = React.useState(initialEmails);
  const [digest] = React.useState(initialDigest);
  const [category, setCategory] = React.useState<CategoryFilter>("all");
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [isComposeOpen, setIsComposeOpen] = React.useState(false);

  React.useEffect(() => {
    if (searchParams.get("connected")) {
      toast.success("Gmail connected");
      router.replace("/dashboard/email");
    }
    const error = searchParams.get("error");
    if (error) {
      toast.error("Couldn't connect Gmail", { description: CONNECT_ERROR_MESSAGES[error] ?? error });
      router.replace("/dashboard/email");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/email/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      if (data.newCount > 0) {
        toast.success(`Found ${data.newCount} new job-related email${data.newCount === 1 ? "" : "s"}`);
        router.refresh();
      } else {
        toast.info(data.message ?? "No new job-related emails found.");
      }
    } catch (err) {
      toast.error("Couldn't sync Gmail", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Gmail? You can reconnect any time.")) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/email/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      toast.success("Gmail disconnected");
      router.refresh();
    } catch (err) {
      toast.error("Couldn't disconnect Gmail", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleArchived = (emailId: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== emailId));
  };

  const handleSent = () => {
    router.refresh();
  };

  const handleSelectFromDigest = (emailId: string) => {
    const email = emails.find((e) => e.id === emailId);
    if (email) setCategory(email.type as CategoryFilter);
    // The list itself scrolling to / auto-expanding that exact email
    // is a nice-to-have beyond this — selecting its category at least
    // surfaces it immediately among a short, relevant list.
  };

  const filteredEmails =
    category === "all"
      ? emails
      : category === "follow_up_needed"
        ? [] // computed from job_applications, not a real emails-table filter — nothing to list here
        : emails.filter((e) => e.type === category);

  return (
    <div className="space-y-6">
      <GmailConnectionBar
        connectedEmail={connectedEmail}
        isSyncing={isSyncing}
        isDisconnecting={isDisconnecting}
        onSync={handleSync}
        onDisconnect={handleDisconnect}
      />

      <DailyDigestCard digest={digest} onSelectEmail={handleSelectFromDigest} />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setIsComposeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Compose New Email
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <EmailCategoryPanel emails={emails} digest={digest} selected={category} onSelect={setCategory} />
        {category === "follow_up_needed" ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {digest.followUpsNeeded > 0
              ? `${digest.followUpsNeeded} application${digest.followUpsNeeded === 1 ? "" : "s"} from your Job Hunter activity ha${digest.followUpsNeeded === 1 ? "s" : "ve"} had no reply after 7 days. Check the Jobs page to follow up.`
              : "No applications are overdue for a follow-up right now."}
          </div>
        ) : (
          <EmailList emails={filteredEmails} isConnected={Boolean(connectedEmail)} onArchived={handleArchived} onSent={handleSent} />
        )}
      </div>

      <ComposeEmailModal open={isComposeOpen} onOpenChange={setIsComposeOpen} onSent={handleSent} resumes={resumes} />
    </div>
  );
}
