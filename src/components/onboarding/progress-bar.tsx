"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-foreground">{steps[currentStep]}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
        <motion.div
          className="h-full rounded-full bg-gradient-primary"
          initial={false}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
