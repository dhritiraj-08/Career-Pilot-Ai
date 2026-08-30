"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/shared/empty-state";
import { ResumeUploadButton } from "./resume-upload-button";
import { ResumeListItem } from "./resume-list-item";
import { ResumePreviewPanel } from "./resume-preview-panel";

export interface ResumeRow {
  id: string;
  name: string;
  /** Storage object path (e.g. "{user_id}/{id}.pdf"), NOT a public URL —
   * the "resumes" bucket is private; see docs/storage-setup.sql. */
  file_url: string;
  parsed_content: { file_size_bytes?: number; mime_type?: string } | null;
  is_primary: boolean;
  created_at: string;
}

interface ResumeVaultClientProps {
  userId: string;
  initialResumes: ResumeRow[];
}

export function ResumeVaultClient({ userId, initialResumes }: ResumeVaultClientProps) {
  const supabase = createClient();
  const [resumes, setResumes] = React.useState<ResumeRow[]>(initialResumes);
  const [selectedId, setSelectedId] = React.useState<string | null>(initialResumes[0]?.id ?? null);
  const [settingPrimaryId, setSettingPrimaryId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const selectedResume = resumes.find((r) => r.id === selectedId) ?? null;

  const handleUploaded = (resume: ResumeRow) => {
    setResumes((prev) => {
      const cleared = resume.is_primary ? prev.map((r) => ({ ...r, is_primary: false })) : prev;
      return [resume, ...cleared];
    });
    setSelectedId(resume.id);
  };

  const handleSetPrimary = async (id: string) => {
    setSettingPrimaryId(id);
    try {
      const { error: clearError } = await supabase
        .from("resumes")
        .update({ is_primary: false })
        .eq("user_id", userId)
        .neq("id", id);
      if (clearError) throw clearError;

      const { error: setError } = await supabase.from("resumes").update({ is_primary: true }).eq("id", id);
      if (setError) throw setError;

      setResumes((prev) => prev.map((r) => ({ ...r, is_primary: r.id === id })));
      toast.success("Primary resume updated");
    } catch (err) {
      toast.error("Couldn't set primary", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const target = resumes.find((r) => r.id === id);
    if (!target) return;

    setDeletingId(id);
    try {
      const { error: storageError } = await supabase.storage.from("resumes").remove([target.file_url]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from("resumes").delete().eq("id", id);
      if (dbError) throw dbError;

      let remaining = resumes.filter((r) => r.id !== id);

      // Deleting the primary resume shouldn't leave agents with none —
      // promote the most recently uploaded remaining one.
      if (target.is_primary && remaining.length > 0) {
        const newPrimary = remaining[0];
        const { error: promoteError } = await supabase
          .from("resumes")
          .update({ is_primary: true })
          .eq("id", newPrimary.id);
        if (!promoteError) {
          remaining = remaining.map((r) => (r.id === newPrimary.id ? { ...r, is_primary: true } : r));
        }
      }

      setResumes(remaining);
      setSelectedId((prev) => (prev === id ? remaining[0]?.id ?? null : prev));
      toast.success("Resume deleted");
    } catch (err) {
      toast.error("Couldn't delete", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <ResumeUploadButton userId={userId} hasExistingResumes={resumes.length > 0} onUploaded={handleUploaded} />

        {resumes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resumes yet"
            description="Upload a PDF to get started — the Job Hunter and Interview agents use your primary resume."
          />
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => (
              <ResumeListItem
                key={resume.id}
                resume={resume}
                isSelected={resume.id === selectedId}
                isSettingPrimary={settingPrimaryId === resume.id}
                isDeleting={deletingId === resume.id}
                onSelect={() => setSelectedId(resume.id)}
                onSetPrimary={() => handleSetPrimary(resume.id)}
                onDelete={() => handleDelete(resume.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ResumePreviewPanel resume={selectedResume} />
    </div>
  );
}
