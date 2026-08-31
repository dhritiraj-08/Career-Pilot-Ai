"use client";

import * as React from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { Mic, FileText } from "lucide-react";

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
import { cn } from "@/lib/utils";
import {
  INTERVIEW_TYPES,
  QUESTION_COUNTS,
  type InterviewType,
  type QuestionCount,
} from "@/lib/validations/interview";

export interface ResumeOption {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface InterviewSetupValues {
  resumeId: string;
  jobDescription: string;
  targetRole: string;
  interviewType: InterviewType;
  questionCount: QuestionCount;
}

interface InterviewSetupFormProps {
  resumes: ResumeOption[];
  defaultTargetRole: string;
  isLoading: boolean;
  onSubmit: (values: InterviewSetupValues) => void;
}

const TYPE_LABELS: Record<InterviewType, string> = {
  technical: "Technical",
  hr: "HR",
  mixed: "Mixed",
};

export function InterviewSetupForm({ resumes, defaultTargetRole, isLoading, onSubmit }: InterviewSetupFormProps) {
  const defaultResumeId = resumes.find((r) => r.isPrimary)?.id ?? resumes[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InterviewSetupValues>({
    defaultValues: {
      resumeId: defaultResumeId,
      jobDescription: "",
      targetRole: defaultTargetRole,
      interviewType: "mixed",
      questionCount: 10,
    },
  });

  if (resumes.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-6">
        <EmptyState
          icon={FileText}
          title="No resumes in your vault"
          description="Upload a resume first so the Interview Agent has your background to ask about."
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
      className="mx-auto max-w-lg space-y-5 rounded-lg border border-border bg-card p-6"
      noValidate
    >
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
          <Mic className="h-5 w-5 text-white" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Interview Agent</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice a live mock interview tailored to your resume and target role.
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
        <Label htmlFor="jobDescription">Job description (optional)</Label>
        <Textarea
          id="jobDescription"
          placeholder="Paste the job description to ground technical questions in it..."
          className="min-h-[140px]"
          {...register("jobDescription")}
        />
      </div>

      <div className="space-y-2">
        <Label>Interview type</Label>
        <Controller
          control={control}
          name="interviewType"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {INTERVIEW_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => field.onChange(type)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-fast",
                    field.value === type
                      ? "border-transparent bg-gradient-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Number of questions</Label>
        <Controller
          control={control}
          name="questionCount"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {QUESTION_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => field.onChange(count)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-fast",
                    field.value === count
                      ? "border-transparent bg-gradient-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        <Mic className="mr-2 h-4 w-4" />
        {isLoading ? "Preparing interview..." : "Start Interview"}
      </Button>
    </form>
  );
}
