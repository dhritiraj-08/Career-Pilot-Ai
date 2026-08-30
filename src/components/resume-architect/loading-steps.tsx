"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import { pulseGlow } from "@/lib/animations";

const STEPS = [
  "Analyzing your resume...",
  "Matching with job requirements...",
  "Generating tailored resume...",
  "Writing cover letter...",
];

const STEP_DURATION_MS = 3500;

/**
 * The backend does run through roughly these phases in order (see
 * route.ts), but this is a single request/response, not a stream — so
 * this timer-driven advance is a perceived-progress indicator, not a
 * real-time mirror of server state. It caps at the last step rather
 * than looping if the request runs long.
 */
export function LoadingSteps() {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    setActiveStep(0);
    const interval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, STEP_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-8">
      <motion.div
        variants={pulseGlow}
        animate="animate"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary"
      >
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      </motion.div>
      <ul className="space-y-3">
        {STEPS.map((step, index) => (
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
