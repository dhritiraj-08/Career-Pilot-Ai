"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, PenLine, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { pulseGlow } from "@/lib/animations";
import type { ParsedResumeProfile } from "@/lib/validations/resume-parse";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface ParseResponse {
  resumeId: string;
  usedFallback: boolean;
  profile: ParsedResumeProfile;
}

interface StepResumeUploadProps {
  onParsed: (resumeId: string, profile: ParsedResumeProfile) => void;
  onSkip: () => void;
}

export function StepResumeUpload({ onParsed, onSkip }: StepResumeUploadProps) {
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
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const data = (await res.json()) as ParseResponse | { error: string };

      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Something went wrong");
      }

      toast.success(
        data.usedFallback ? "Resume saved" : "Resume parsed — review your details below",
        {
          description: data.usedFallback
            ? "We saved it to your vault but couldn't auto-fill everything — no problem, just fill in what's missing."
            : undefined,
        }
      );
      onParsed(data.resumeId, data.profile);
    } catch (err) {
      toast.error("Couldn't process resume", {
        description: err instanceof Error ? err.message : "Please try again or fill in manually.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <motion.div
          variants={pulseGlow}
          animate="animate"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </motion.div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Reading your resume with AI...
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Do you have an existing resume?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload it and we&apos;ll pre-fill your profile — you can review and edit everything
          after.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center transition-colors duration-fast hover:border-primary hover:bg-accent"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Upload my resume</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, up to 5MB</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center transition-colors duration-fast hover:border-border-strong hover:bg-accent"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent">
            <PenLine className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">I&apos;ll fill this in manually</p>
            <p className="mt-1 text-xs text-muted-foreground">Start from scratch</p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        Your resume is saved to your Resume Vault either way.
      </div>

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
    </div>
  );
}
