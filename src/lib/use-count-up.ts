"use client";

import * as React from "react";
import { animate } from "framer-motion";

/**
 * Animates a number counting up from 0 to `value` on first render (and
 * whenever `value` changes) — used for dashboard/stat-card numbers per
 * the visual revamp's "number counters animate up" requirement.
 * Framer Motion's imperative `animate()` rather than a variants object,
 * since this drives a plain text node's content, not a style property.
 */
export function useCountUp(value: number, durationSeconds = 0.8): number {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(0, value, {
      duration: durationSeconds,
      ease: [0.2, 0, 0, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, durationSeconds]);

  return display;
}
