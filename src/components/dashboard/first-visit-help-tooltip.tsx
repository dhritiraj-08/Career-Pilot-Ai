"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STORAGE_KEY = "cp_seen_help_nudge";

/** One-time nudge toward /help on a user's first dashboard visit in
 * this browser — purely a localStorage flag, no account-level state,
 * so it reappears in a different browser/private window but never
 * repeats in the same one. */
export function FirstVisitHelpTooltip() {
  const router = useRouter();

  React.useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      return; // storage unavailable (private mode, etc.) — skip rather than nag every load
    }

    const timer = setTimeout(() => {
      toast.info("New here? Check out our guide →", {
        description: "A full walkthrough of every agent, in one place.",
        duration: 8000,
        action: {
          label: "Open guide",
          onClick: () => router.push("/help"),
        },
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
