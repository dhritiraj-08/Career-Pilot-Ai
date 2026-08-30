"use client";

import * as React from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { ResumeRow } from "./resume-vault-client";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface ResumeUploadButtonProps {
  userId: string;
  hasExistingResumes: boolean;
  onUploaded: (resume: ResumeRow) => void;
}

/**
 * Uploads to `resumes/{userId}/{id}.pdf` (id generated client-side so the
 * storage key is known before the DB row exists), then inserts the row
 * referencing that path. If the insert fails, the just-uploaded object
 * is removed so a failed upload never leaves an orphaned file.
 */
export function ResumeUploadButton({ userId, hasExistingResumes, onUploaded }: ResumeUploadButtonProps) {
  const supabase = createClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("PDF only", { description: "Please upload a PDF file." });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File too large", { description: "Max size is 5MB." });
      return;
    }

    setIsUploading(true);
    const id = crypto.randomUUID();
    const path = `${userId}/${id}.pdf`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("resumes")
        .insert({
          id,
          user_id: userId,
          name: file.name,
          file_url: path,
          parsed_content: { file_size_bytes: file.size, mime_type: file.type },
          is_primary: !hasExistingResumes,
        })
        .select("id, name, file_url, parsed_content, is_primary, created_at")
        .single();

      if (insertError) {
        await supabase.storage.from("resumes").remove([path]);
        throw insertError;
      }

      onUploaded(data as ResumeRow);
      toast.success("Resume uploaded");
    } catch (err) {
      toast.error("Couldn't upload resume", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button type="button" className="w-full" onClick={() => inputRef.current?.click()} disabled={isUploading}>
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Upload resume
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
