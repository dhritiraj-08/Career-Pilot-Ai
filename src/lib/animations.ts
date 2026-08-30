import type { Variants } from "framer-motion";

// Shared Framer Motion variants — see docs/design-system.md §4.
// Reused across features so motion reads as one consistent system.

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// "AI is working" indicator — first real use is the resume-parsing
// loading state (Phase 5), matching the "agent thinking" pulse
// described in docs/design-system.md §4.
export const pulseGlow: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
};
