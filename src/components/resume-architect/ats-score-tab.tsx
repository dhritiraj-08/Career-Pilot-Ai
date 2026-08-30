import { Check, X } from "lucide-react";

import type { ResumeArchitectResult } from "@/lib/validations/resume-architect";
import { ScoreCircle } from "./score-circle";
import { ScoreBar } from "./score-bar";

export function AtsScoreTab({ result }: { result: ResumeArchitectResult }) {
  return (
    <div className="space-y-6">
      {result.usedFallback && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          This is a basic automated analysis — the full AI review was temporarily unavailable.
        </div>
      )}

      <div className="flex flex-col items-center gap-2 py-2">
        <ScoreCircle score={result.atsScore} />
        <p className="text-sm text-muted-foreground">Overall ATS match</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreBar label="Skills match" value={result.scoreBreakdown.skills_match} />
        <ScoreBar label="Experience match" value={result.scoreBreakdown.experience_match} />
        <ScoreBar label="Keywords match" value={result.scoreBreakdown.keywords_match} />
        <ScoreBar label="Education match" value={result.scoreBreakdown.education_match} />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium text-foreground">Keywords found</h4>
        {result.keywordsFound.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {result.keywordsFound.map((kw) => (
              <span key={kw} className="rounded-full bg-success/15 px-3 py-1 text-xs text-success">
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">None detected.</p>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium text-foreground">Keywords missing</h4>
        {result.keywordsMissing.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {result.keywordsMissing.map((kw) => (
              <span key={kw} className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive">
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">None — great coverage.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Check className="h-4 w-4 text-success" /> Strengths
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {result.strengths.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <X className="h-4 w-4 text-destructive" /> Weaknesses
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {result.weaknesses.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
