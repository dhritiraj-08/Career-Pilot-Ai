"use client";

import { motion } from "framer-motion";

const BAR_COUNT = 24;

/** Animated bar visualization shown while the AI interviewer is
 * "speaking" (text-to-speech). Not driven by real audio amplitude —
 * the Web Speech API exposes no waveform data — so this is a visual
 * indicator of speaking state, not a literal representation of the
 * audio, with randomized-but-stable per-bar timing so it doesn't look
 * mechanically uniform. */
export function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-12 items-center justify-center gap-1" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const baseHeight = 6 + ((i * 7919) % 20); // stable pseudo-random 6-26px per bar
        const duration = 0.5 + ((i * 37) % 5) / 10; // 0.5-0.9s
        return (
          <motion.span
            key={i}
            className="w-1 rounded-full bg-gradient-primary"
            style={{ height: active ? undefined : 4 }}
            animate={
              active
                ? { height: [4, baseHeight, 4] }
                : { height: 4 }
            }
            transition={
              active
                ? { duration, repeat: Infinity, ease: "easeInOut", delay: (i % 6) * 0.05 }
                : { duration: 0.2 }
            }
          />
        );
      })}
    </div>
  );
}
