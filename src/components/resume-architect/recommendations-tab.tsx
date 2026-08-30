import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/validations/resume-architect";

const PRIORITY_STYLE: Record<Recommendation["priority"], string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-accent text-muted-foreground",
};

const PRIORITY_LABEL: Record<Recommendation["priority"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function RecommendationsTab({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) {
    return <p className="text-sm text-muted-foreground">No specific recommendations — nice work.</p>;
  }

  return (
    <ul className="space-y-3">
      {recommendations.map((rec, i) => (
        <li
          key={i}
          className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-4"
        >
          <p className="text-sm text-foreground">{rec.text}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              PRIORITY_STYLE[rec.priority]
            )}
          >
            {PRIORITY_LABEL[rec.priority]}
          </span>
        </li>
      ))}
    </ul>
  );
}
