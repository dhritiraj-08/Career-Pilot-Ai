"use client";

import * as React from "react";
import { Check, Download, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ResumeRow } from "./resume-vault-client";

interface ResumeListItemProps {
  resume: ResumeRow;
  isSelected: boolean;
  isSettingPrimary: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
}

export function ResumeListItem({
  resume,
  isSelected,
  isSettingPrimary,
  isDeleting,
  onSelect,
  onSetPrimary,
  onDelete,
}: ResumeListItemProps) {
  const supabase = createClient();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const fileSize = resume.parsed_content?.file_size_bytes;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
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
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-lg border p-4 transition-colors duration-fast",
        isSelected ? "border-primary bg-accent" : "border-border bg-card hover:border-border-strong"
      )}
    >
      <div className="flex items-center gap-2">
        <p className="truncate text-sm font-medium text-foreground">{resume.name}</p>
        {resume.is_primary && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Star className="h-2.5 w-2.5 fill-current" /> Primary
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatDate(resume.created_at)}
        {fileSize ? ` · ${formatFileSize(fileSize)}` : ""}
      </p>
      <div className="mt-3 flex items-center gap-1">
        {!resume.is_primary && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSetPrimary();
            }}
            disabled={isSettingPrimary}
          >
            {isSettingPrimary ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1 h-3.5 w-3.5" />
            )}
            Set primary
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label="Download"
        >
          {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          aria-label="Delete"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          )}
        </Button>
      </div>
    </div>
  );
}
