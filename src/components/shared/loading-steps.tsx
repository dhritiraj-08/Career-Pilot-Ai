"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import { pulseGlow } from "@/lib/animations";
import { cn } from "@/lib/utils";

const STEP_DURATION_MS = 3500;

interface LoadingStepsProps {
  steps: string[];
  /** Tighter layout for a sidebar/panel context (Job Hunter's search
   * panel) instead of the full-height centered block resume-architect
   * uses for its whole results pane. */
  compact?: boolean;
}

/**
 * Generic animated progress-step loader, used by both Resume Architect
 * and Job Hunter. The backend for either does run through roughly
 * these phases in order, but this is a single request/response, not a
 * stream — so this timer-driven advance is a perceived-progress
 * indicator, not a real-time mirror of server state. Caps at the last
 * step rather than looping if the request runs long.
 */
export function LoadingSteps({ steps, compact = false }: LoadingStepsProps) {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    setActiveStep(0);
    const interval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, steps.length - 1));
    }, STEP_DURATION_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-8",
        compact ? "gap-4 py-2" : "min-h-[400px]"
      )}
    >
      <motion.div
        variants={pulseGlow}
        animate="animate"
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-primary",
          compact ? "h-9 w-9" : "h-14 w-14"
        )}
      >
        <Loader2 className={cn("animate-spin text-white", compact ? "h-4 w-4" : "h-6 w-6")} />
      </motion.div>
      <ul className="space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 text-sm">
            {index < activeStep ? (
              <Check className="h-4 w-4 shrink-0 text-success" />
            ) : index === activeStep ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-secondary" />
            ) : (
              <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
            )}
            <span className={index <= activeStep ? "text-foreground" : "text-muted-foreground"}>
              {step}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
