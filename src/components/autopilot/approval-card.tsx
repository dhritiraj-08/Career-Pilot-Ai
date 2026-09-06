"use client";

import * as React from "react";
import { Check, ExternalLink, MessageSquare, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";
import { APPROVAL_TYPE_LABELS, type AutopilotApprovalRow } from "@/lib/validations/autopilot";

interface ApprovalCardProps {
  approval: AutopilotApprovalRow;
  busy: boolean;
  onApprove: (id: string, edits?: { subject: string; body: string; to: string }) => void;
  onReject: (id: string) => void;
}

/** A pending draft awaiting the user's decision — the human-in-the-loop
 * gate nothing gets sent without. Sent/Skipped cards reuse this in a
 * read-only, non-pulsing mode (no action buttons). */
export function ApprovalCard({ approval, busy, onApprove, onReject }: ApprovalCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [to, setTo] = React.useState(approval.email_to ?? "");
  const [subject, setSubject] = React.useState(approval.email_draft_subject ?? "");
  const [body, setBody] = React.useState(approval.email_draft_body ?? "");
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isPending = approval.status === "pending";
  const company = approval.context?.company ?? "Unknown company";
  const role = approval.context?.role ?? "";
  const missingRecipient = isPending && !approval.email_to;
  const applyUrl = approval.context?.applyUrl;
  const interviewSessionId = approval.context?.interviewSessionId;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4",
        isPending ? "border-warning/50 animate-pulse-glow" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {APPROVAL_TYPE_LABELS[approval.type]}
            </span>
            {typeof approval.context?.matchScore === "number" && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                {approval.context.matchScore}% match
              </span>
            )}
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold text-foreground">
            {company}
            {role ? ` — ${role}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(approval.created_at)}</p>
          <div className="mt-1.5 flex flex-wrap gap-3">
            {applyUrl && (
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Apply via link
              </a>
            )}
            {interviewSessionId && (
              <a
                href={`/dashboard/interview?sessionId=${interviewSessionId}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <MessageSquare className="h-3 w-3" />
                Interview prep ready
              </a>
            )}
          </div>
        </div>
      </div>

      {!isEditing ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-muted-foreground">
            To: <span className="text-foreground">{approval.email_to || "Not found on this listing"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Subject: <span className="text-foreground">{approval.email_draft_subject}</span>
          </p>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="text-left text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {isExpanded ? "Hide draft" : "Preview draft"}
          </button>
          {isExpanded && (
            <p className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-xs text-foreground">
              {approval.email_draft_body}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div>
            <Label className="text-[11px] text-muted-foreground">To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" className="h-9" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[140px] text-xs" />
          </div>
        </div>
      )}

      {missingRecipient && !isEditing && (
        <p className="mt-2 text-[11px] text-warning">
          No direct email found on this listing — use Edit &amp; Approve to add one{applyUrl ? ", or apply via the link above" : ""}.
        </p>
      )}

      {isPending && (
        <div className="mt-3 flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button
                type="button"
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
                disabled={busy || !to.trim() || !subject.trim() || !body.trim()}
                onClick={() => onApprove(approval.id, { to: to.trim(), subject: subject.trim(), body: body.trim() })}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Approve &amp; Send
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={busy}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
                disabled={busy || missingRecipient}
                onClick={() => onApprove(approval.id)}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Approve
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setIsEditing(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit &amp; Approve
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={busy}
                onClick={() => onReject(approval.id)}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
