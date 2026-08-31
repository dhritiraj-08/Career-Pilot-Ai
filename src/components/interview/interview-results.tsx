"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Download, Loader2, RotateCcw, TrendingDown, TrendingUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/shared/score-bar";
import { cn } from "@/lib/utils";
import type { InterviewResultResponse } from "@/app/api/agents/interview/result/[sessionId]/route";

interface InterviewResultsProps {
  sessionId: string;
  onStartNew: () => void;
}

function scoreColorClasses(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

const TYPE_LABEL: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
  aptitude: "Aptitude",
};

export function InterviewResults({ sessionId, onStartNew }: InterviewResultsProps) {
  const [data, setData] = React.useState<InterviewResultResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/agents/interview/result/${sessionId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Couldn't load results");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          toast.error("Couldn't load interview results", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleDownload = async () => {
    if (!data) return;
    setIsDownloading(true);
    try {
      const { downloadInterviewReportPdf } = await import("@/lib/pdf");
      await downloadInterviewReportPdf(`interview-report-${sessionId.slice(0, 8)}.pdf`, data);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Couldn&apos;t load this interview&apos;s results.
      </div>
    );
  }

  const { session, questions } = data;
  const overall = session.overallScore ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Overall score</p>
        <p className={cn("font-heading text-5xl font-bold", scoreColorClasses(overall))}>{overall}</p>
        <p className="text-xs text-muted-foreground">out of 100</p>

        <div className="mx-auto mt-6 grid max-w-md grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <ScoreBar label="Technical" value={session.technicalScore ?? 0} />
          <ScoreBar label="Communication" value={session.communicationScore ?? 0} />
          <ScoreBar label="Confidence" value={session.confidenceScore ?? 0} />
        </div>

        {session.summary && <p className="mx-auto mt-6 max-w-lg text-sm text-muted-foreground">{session.summary}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="outline" onClick={handleDownload} disabled={isDownloading}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isDownloading ? "Preparing..." : "Download Report"}
          </Button>
          <Button type="button" onClick={onStartNew}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Start New Interview
          </Button>
        </div>
      </div>

      {(session.strengths.length > 0 || session.weaknesses.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {session.strengths.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-success" /> Strengths
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {session.strengths.map((s) => (
                  <li key={s} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {session.weaknesses.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <TrendingDown className="h-4 w-4 text-destructive" /> Weaknesses
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {session.weaknesses.map((w) => (
                  <li key={w} className="flex gap-2">
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {session.recommendations.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Recommendations</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {session.recommendations.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-secondary">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Per-question review</h3>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Q{i + 1} · {TYPE_LABEL[q.type] ?? q.type}
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground">{q.question}</p>
                </div>
                {q.answer?.score != null && (
                  <span className={cn("shrink-0 text-sm font-semibold", scoreColorClasses(q.answer.score))}>
                    {q.answer.score}/100
                  </span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Your answer: </span>
                {q.answer?.text || "(no answer given)"}
              </p>
              {q.answer?.feedback && (
                <p className="mt-2 rounded-md bg-accent px-3 py-2 text-sm text-foreground">{q.answer.feedback}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
