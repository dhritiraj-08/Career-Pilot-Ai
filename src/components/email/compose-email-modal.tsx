"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { COMPOSE_TYPES, COMPOSE_TYPE_LABELS, type ComposeType } from "@/lib/validations/email";

interface ComposeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}

export function ComposeEmailModal({ open, onOpenChange, onSent }: ComposeEmailModalProps) {
  const [to, setTo] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [composeType, setComposeType] = React.useState<ComposeType>("application");
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState("");
  const [highlights, setHighlights] = React.useState("");
  const [recipientName, setRecipientName] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const reset = () => {
    setTo("");
    setSubject("");
    setBody("");
    setCompany("");
    setRole("");
    setHighlights("");
    setRecipientName("");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/email/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: composeType, company, role, highlights, recipientName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSubject(data.subject);
      setBody(data.body);
      if (data.usedFallback) {
        toast.warning("AI generation was limited", { description: "Using a basic template — feel free to edit it." });
      }
    } catch (err) {
      toast.error("Couldn't generate email", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("To, subject, and body are all required");
      return;
    }
    setIsSending(true);
    try {
      const composeToEmailType: Record<ComposeType, string> = {
        application: "application",
        followup: "follow_up",
        thankyou: "thank_you",
        cold: "other",
      };
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, type: composeToEmailType[composeType] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      toast.success("Email sent");
      reset();
      onOpenChange(false);
      onSent();
    } catch (err) {
      toast.error("Couldn't send email", { description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compose New Email</DialogTitle>
          <DialogDescription>Write your own, or let AI draft it from a bit of context.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compose-to">To</Label>
            <Input id="compose-to" type="email" placeholder="recipient@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input id="compose-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-2 rounded-md border border-border bg-background p-3">
            <Label>Generate email for</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COMPOSE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setComposeType(type)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors duration-fast",
                    composeType === type
                      ? "border-transparent bg-gradient-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {COMPOSE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <Input placeholder="Recipient name (optional)" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            <Textarea
              placeholder="Your resume bullet points / highlights to reference..."
              className="min-h-[70px]"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
            />
            <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {isGenerating ? "Generating..." : `Generate email for ${COMPOSE_TYPE_LABELS[composeType]}`}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea id="compose-body" className="min-h-[160px]" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <Button type="button" className="w-full" size="lg" onClick={handleSend} disabled={isSending}>
            <Send className="mr-2 h-4 w-4" />
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
