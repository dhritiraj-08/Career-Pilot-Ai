"use client";

import * as React from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { consumeResumeArchitectPrefill } from "@/lib/job-handoff";

export interface ResumeOption {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface ResumeArchitectFormValues {
  resumeId: string;
  jobDescription: string;
  targetRole: string;
}

interface ResumeArchitectFormProps {
  resumes: ResumeOption[];
  isLoading: boolean;
  onSubmit: (values: ResumeArchitectFormValues) => void;
}

export function ResumeArchitectForm({ resumes, isLoading, onSubmit }: ResumeArchitectFormProps) {
  const defaultResumeId = resumes.find((r) => r.isPrimary)?.id ?? resumes[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ResumeArchitectFormValues>({
    defaultValues: { resumeId: defaultResumeId, jobDescription: "", targetRole: "" },
  });

  // One-time prefill from "Build Resume for This Job" (Job Hunter). Runs
  // once on mount; consumeResumeArchitectPrefill() clears the stored
  // value itself so a page refresh doesn't re-apply stale data.
  React.useEffect(() => {
    const prefill = consumeResumeArchitectPrefill();
    if (prefill) {
      setValue("jobDescription", prefill.jobDescription, { shouldValidate: true });
      setValue("targetRole", prefill.targetRole, { shouldValidate: true });
      toast.success("Job description loaded from Job Hunter");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (resumes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <EmptyState
          icon={FileText}
          title="No resumes in your vault"
          description="Upload a resume first so the Resume Architect has something to work with."
          action={
            <Link href="/dashboard/resumes" className="text-sm text-secondary hover:underline">
              Go to Resume Vault
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-lg border border-border bg-card p-5"
      noValidate
    >
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Resume Architect</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a job description and we&apos;ll tailor your resume, write a cover letter, and
          score your ATS match.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Resume</Label>
        <Controller
          control={control}
          name="resumeId"
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.name}
                    {resume.isPrimary ? " (Primary)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetRole">Target role</Label>
        <Input
          id="targetRole"
          placeholder="e.g. Senior Frontend Engineer"
          {...register("targetRole", { required: true })}
        />
        {errors.targetRole && <p className="text-xs text-destructive">Target role is required</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">Job description</Label>
        <Textarea
          id="jobDescription"
          placeholder="Paste the full job description here..."
          className="min-h-[220px]"
          {...register("jobDescription", { required: true, minLength: 20 })}
        />
        {errors.jobDescription && (
          <p className="text-xs text-destructive">
            Paste the full job description (at least 20 characters)
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        <Sparkles className="mr-2 h-4 w-4" />
        {isLoading ? "Generating..." : "Analyze & Generate"}
      </Button>
    </form>
  );
}
