"use client";

import * as React from "react";
import { toast } from "sonner";
import { Archive, ChevronDown, Forward, Loader2, Reply, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDate } from "@/lib/utils";
import { CATEGORY_LABELS, type EmailCategory, type EmailRow } from "@/lib/validations/email";

const CATEGORY_BADGE_CLASS: Partial<Record<EmailCategory, string>> = {
  interview_invite: "bg-secondary/15 text-secondary",
  offer: "bg-success/15 text-success",
  rejection: "bg-destructive/15 text-destructive",
  recruiter_outreach: "bg-warning/15 text-warning",
};

interface EmailListItemProps {
  email: EmailRow;
  onArchived: (emailId: string) => void;
  onSent: () => void;
}

type ComposerMode = null | "reply" | "forward";

export function EmailListItem({ email, onArchived, onSent }: EmailListItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [composerMode, setComposerMode] = React.useState<ComposerMode>(null);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState("");
  const [replySubject, setReplySubject] = React.useState("");
  const [replyBody, setReplyBody] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);

  const category = email.type as EmailCategory;
  const badgeClass = CATEGORY_BADGE_CLASS[category] ?? "bg-accent text-muted-foreground";
  const dateLabel = email.received_at ? formatDate(email.received_at) : email.sent_at ? formatDate(email.sent_at) : formatDate(email.created_at);

  const startReply = async () => {
    setExpanded(true);
    setComposerMode("reply");
    setReplyTo(email.sender_email ?? "");
    setReplySubject(email.subject?.toLowerCase().startsWith("re:") ? email.subject : `Re: ${email.subject ?? ""}`);
    setReplyBody("");
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/email/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: email.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setReplyBody(data.body);
      if (data.usedFallback) {
        toast.warning("AI suggestion was limited", { description: "Using a basic placeholder reply — feel free to rewrite it." });
      }
    } catch (err) {
      toast.error("Couldn't generate a suggested reply", {
        description: err instanceof Error ? err.message : "You can still write one yourself below.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const startForward = () => {
    setExpanded(true);
    setComposerMode("forward");
    setReplyTo("");
    setReplySubject(email.subject?.toLowerCase().startsWith("fwd:") ? email.subject : `Fwd: ${email.subject ?? ""}`);
    setReplyBody(
      `\n\n---------- Forwarded message ----------\nFrom: ${email.sender ?? "Unknown"}\nSubject: ${email.subject ?? ""}\n\n${email.body ?? ""}`
    );
  };

  const handleSend = async () => {
    if (!replyTo.trim() || !replySubject.trim() || !replyBody.trim()) {
      toast.error("To, subject, and body are all required");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyTo,
          subject: replySubject,
          body: replyBody,
          threadId: composerMode === "reply" ? email.gmail_thread_id ?? undefined : undefined,
          type: composerMode === "reply" ? "follow_up" : "other",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      toast.success("Email sent");
      setComposerMode(null);
      onSent();
    } catch (err) {
      toast.error("Couldn't send email", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setIsSending(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await fetch("/api/email/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: email.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      toast.success("Email archived");
      onArchived(email.id);
    } catch (err) {
      toast.error("Couldn't archive email", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{email.sender ?? email.recipient ?? "Unknown"}</p>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", badgeClass)}>
              {CATEGORY_LABELS[category] ?? category}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{email.subject || "(no subject)"}</p>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {email.status !== "sent" && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={startReply}>
                <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={startForward}>
                <Forward className="mr-1.5 h-3.5 w-3.5" /> Forward
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleArchive} disabled={isArchiving}>
                <Archive className="mr-1.5 h-3.5 w-3.5" /> {isArchiving ? "Archiving..." : "Archive"}
              </Button>
            </div>
          )}

          <p className="whitespace-pre-line text-sm text-foreground">{email.body || "(no content)"}</p>

          {composerMode && (
            <div className="space-y-3 rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                <Sparkles className="h-3.5 w-3.5" />
                {composerMode === "reply" ? "AI suggested reply" : "Forward this email"}
                {isSuggesting && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`to-${email.id}`}>To</Label>
                <Input id={`to-${email.id}`} value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="recipient@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`subject-${email.id}`}>Subject</Label>
                <Input id={`subject-${email.id}`} value={replySubject} onChange={(e) => setReplySubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`body-${email.id}`}>Message</Label>
                <Textarea
                  id={`body-${email.id}`}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="min-h-[140px]"
                  disabled={isSuggesting}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setComposerMode(null)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSend} disabled={isSending || isSuggesting}>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> {isSending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
