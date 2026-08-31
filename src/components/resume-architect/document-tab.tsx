"use client";

import * as React from "react";
import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface DocumentTabProps {
  documentType: "resume" | "coverLetter";
  filename: string;
  candidateName: string;
  content: string;
}

/** Shared by the Tailored Resume and Cover Letter tabs — same
 * copy/download-PDF affordances around a plain-text document, each
 * rendered through its own properly-typeset PDF layout (see
 * lib/pdf.ts) rather than a generic text dump. */
export function DocumentTab({ documentType, filename, candidateName, content }: DocumentTabProps) {
  const [copied, setCopied] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { downloadResumePdf, downloadCoverLetterPdf } = await import("@/lib/pdf");
      if (documentType === "resume") {
        await downloadResumePdf(filename, candidateName, content);
      } else {
        await downloadCoverLetterPdf(filename, candidateName, content);
      }
    } catch {
      toast.error("Couldn't generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
          Copy
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
          <Download className="mr-2 h-3.5 w-3.5" /> {isDownloading ? "Preparing..." : "Download PDF"}
        </Button>
      </div>
      <div className="max-h-[600px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-foreground">
        {content}
      </div>
    </div>
  );
}
