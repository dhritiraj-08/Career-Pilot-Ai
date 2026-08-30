"use client";

import * as React from "react";
import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadTextAsPdf } from "@/lib/pdf";

interface DocumentTabProps {
  title: string;
  filename: string;
  content: string;
}

/** Shared by the Tailored Resume and Cover Letter tabs — same
 * copy/download-PDF affordances around a plain-text document. */
export function DocumentTab({ title, filename, content }: DocumentTabProps) {
  const [copied, setCopied] = React.useState(false);

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
    try {
      await downloadTextAsPdf(filename, title, content);
    } catch {
      toast.error("Couldn't generate PDF");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
          Copy
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
        </Button>
      </div>
      <div className="max-h-[600px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-foreground">
        {content}
      </div>
    </div>
  );
}
