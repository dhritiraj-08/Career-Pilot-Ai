"use client";

import * as React from "react";
import { toast } from "sonner";

import type { InterviewQuestionItem } from "@/lib/validations/interview";
import { InterviewSetupForm, type ResumeOption, type InterviewSetupValues } from "./interview-setup-form";
import { InterviewRoom } from "./interview-room";
import { InterviewResults } from "./interview-results";

interface InterviewClientProps {
  resumes: ResumeOption[];
  defaultTargetRole: string;
}

type Step =
  | { name: "setup" }
  | { name: "room"; sessionId: string; totalQuestions: number; question: InterviewQuestionItem }
  | { name: "results"; sessionId: string };

export function InterviewClient({ resumes, defaultTargetRole }: InterviewClientProps) {
  const [step, setStep] = React.useState<Step>({ name: "setup" });
  const [isStarting, setIsStarting] = React.useState(false);

  const handleStart = async (values: InterviewSetupValues) => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/agents/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setStep({
        name: "room",
        sessionId: data.sessionId,
        totalQuestions: data.totalQuestions,
        question: data.question,
      });
      if (data.usedFallback) {
        toast.warning("AI question generation was limited", {
          description: "Using a standard question set instead — try again shortly for fully tailored questions.",
        });
      }
    } catch (err) {
      toast.error("Couldn't start interview", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinished = (sessionId: string) => {
    setStep({ name: "results", sessionId });
  };

  const handleStartNew = () => {
    setStep({ name: "setup" });
  };

  if (step.name === "room") {
    return (
      <InterviewRoom
        sessionId={step.sessionId}
        totalQuestions={step.totalQuestions}
        initialQuestion={step.question}
        onFinished={handleFinished}
      />
    );
  }

  if (step.name === "results") {
    return <InterviewResults sessionId={step.sessionId} onStartNew={handleStartNew} />;
  }

  return (
    <InterviewSetupForm
      resumes={resumes}
      defaultTargetRole={defaultTargetRole}
      isLoading={isStarting}
      onSubmit={handleStart}
    />
  );
}
