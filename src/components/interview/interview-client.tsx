"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  | { name: "loading" }
  | { name: "room"; sessionId: string; totalQuestions: number; question: InterviewQuestionItem }
  | { name: "results"; sessionId: string };

export function InterviewClient({ resumes, defaultTargetRole }: InterviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeSessionId = searchParams.get("sessionId");
  const [step, setStep] = React.useState<Step>(resumeSessionId ? { name: "loading" } : { name: "setup" });
  const [isStarting, setIsStarting] = React.useState(false);

  // A link from elsewhere (Autopilot's "Interview prep ready"
  // notification auto-creates a real session — see
  // api/autopilot/approve) lands here with ?sessionId=... instead of
  // the blank setup form.
  React.useEffect(() => {
    if (!resumeSessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/agents/interview/session/${resumeSessionId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Couldn't load that interview session");
        if (data.isComplete) {
          setStep({ name: "results", sessionId: data.sessionId });
        } else {
          setStep({ name: "room", sessionId: data.sessionId, totalQuestions: data.totalQuestions, question: data.question });
        }
      } catch (err) {
        if (cancelled) return;
        toast.error("Couldn't resume that interview", { description: err instanceof Error ? err.message : "Please try again." });
        setStep({ name: "setup" });
      } finally {
        if (!cancelled) router.replace("/dashboard/interview");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeSessionId]);

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

  if (step.name === "loading") {
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading your interview session...</p>;
  }

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
