"use client";

import * as React from "react";
import { toast } from "sonner";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ResumeArchitectResult } from "@/lib/validations/resume-architect";
import { ResumeArchitectForm, type ResumeOption, type ResumeArchitectFormValues } from "./resume-architect-form";
import { LoadingSteps } from "./loading-steps";
import { AtsScoreTab } from "./ats-score-tab";
import { TailoredResumeTab } from "./tailored-resume-tab";
import { CoverLetterTab } from "./cover-letter-tab";
import { RecommendationsTab } from "./recommendations-tab";

interface ResumeArchitectClientProps {
  resumes: ResumeOption[];
}

export function ResumeArchitectClient({ resumes }: ResumeArchitectClientProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<ResumeArchitectResult | null>(null);

  const handleSubmit = async (values: ResumeArchitectFormValues) => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/agents/resume-architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setResult(data as ResumeArchitectResult);
      if (data.usedFallback) {
        toast.warning("AI generation was limited", {
          description: "We saved a basic analysis — try again shortly for the full AI-written version.",
        });
      } else {
        toast.success("Analysis complete");
      }
    } catch (err) {
      toast.error("Couldn't complete analysis", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <ResumeArchitectForm resumes={resumes} onSubmit={handleSubmit} isLoading={isLoading} />

      <div className="rounded-lg border border-border bg-card p-5">
        {isLoading ? (
          <LoadingSteps />
        ) : !result ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Fill in the job description and click &quot;Analyze &amp; Generate&quot; to see your
              ATS score, a tailored resume, and a cover letter here.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="score">
            <TabsList>
              <TabsTrigger value="score">ATS Score</TabsTrigger>
              <TabsTrigger value="resume">Tailored Resume</TabsTrigger>
              <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            <TabsContent value="score">
              <AtsScoreTab result={result} />
            </TabsContent>
            <TabsContent value="resume">
              <TailoredResumeTab content={result.tailoredResumeContent} />
            </TabsContent>
            <TabsContent value="cover-letter">
              <CoverLetterTab content={result.coverLetterContent} />
            </TabsContent>
            <TabsContent value="recommendations">
              <RecommendationsTab recommendations={result.recommendations} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
