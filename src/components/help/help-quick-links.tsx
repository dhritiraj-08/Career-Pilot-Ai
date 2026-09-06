"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { scrollToHelpSection } from "./scroll-to-section";

export function HelpQuickLinks() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => scrollToHelpSection("quick-start")}
        className={cn(buttonVariants({ size: "lg" }), "shadow-glow")}
      >
        Quick Start (5 min)
      </button>
      <button
        type="button"
        onClick={() => scrollToHelpSection("nexus")}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        Full Guide
      </button>
    </div>
  );
}
