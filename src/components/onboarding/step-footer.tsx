"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface StepFooterProps {
  onBack?: () => void;
  onSkip?: () => void;
  isSaving?: boolean;
  isLastStep?: boolean;
}

/** Back/Skip/Next footer shared by every onboarding step. Whether Back
 * or Skip renders is entirely driven by whether that handler was passed —
 * no separate isFirstStep/skippable flags to keep in sync. */
export function StepFooter({ onBack, onSkip, isSaving, isLastStep }: StepFooterProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div>
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack} disabled={isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onSkip && (
          <Button type="button" variant="ghost" onClick={onSkip} disabled={isSaving}>
            Skip
          </Button>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {isLastStep ? "Finish" : "Next"} <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
