"use client";

import * as React from "react";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { formatDate, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import type { ResumeRow } from "./resume-vault-client";

interface ResumePreviewPanelProps {
  resume: ResumeRow | null;
}

export function ResumePreviewPanel({ resume }: ResumePreviewPanelProps) {
  const supabase = createClient();
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!resume) {
      setSignedUrl(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setSignedUrl(null);
    supabase.storage
      .from("resumes")
      .createSignedUrl(resume.file_url, 300)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error("Couldn't load preview", { description: error.message });
          return;
        }
        setSignedUrl(data.signedUrl);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.id]);

  if (!resume) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-card">
        <EmptyState
          icon={FileText}
          title="Select a resume"
          description="Choose a resume from the list to preview it here."
        />
      </div>
    );
  }

  const fileSize = resume.parsed_content?.file_size_bytes;

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(resume.file_url, 60, { download: resume.name });
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (err) {
      toast.error("Couldn't download", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{resume.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Uploaded {formatDate(resume.created_at)}
            {fileSize ? ` · ${formatFileSize(fileSize)}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {signedUrl && (
            <a href={signedUrl} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" size="sm">
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Open
              </Button>
            </a>
          )}
          <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-3.5 w-3.5" /> Download
          </Button>
        </div>
      </div>
      <div className="min-h-[500px] flex-1 p-2">
        {isLoading ? (
          <div className="flex h-full min-h-[480px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : signedUrl ? (
          <iframe src={signedUrl} title={resume.name} className="h-full min-h-[480px] w-full rounded-md" />
        ) : (
          <div className="flex h-full min-h-[480px] items-center justify-center text-sm text-muted-foreground">
            Couldn&apos;t load preview.
          </div>
        )}
      </div>
    </div>
  );
}
