"use client";

import * as React from "react";
import { motion, animate } from "framer-motion";

import { staggerContainer, slideUp } from "@/lib/animations";

const STATS = [
  { value: 2400, suffix: "+", label: "Resumes Built" },
  { value: 18000, suffix: "+", label: "Jobs Discovered" },
  { value: 94, suffix: "%", label: "Interview Rate" },
];

/**
 * Plain native IntersectionObserver, decoupled from the section's own
 * Framer Motion whileInView/variants — kept independent so the count-up
 * trigger doesn't depend on framer-motion's internal viewport/variant
 * plumbing at all, just a standard "has this element been seen" signal.
 */
function useOnScreen(ref: React.RefObject<Element>): boolean {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return isVisible;
}

function StatNumber({ value, suffix, start }: { value: number; suffix: string; start: boolean }) {
  const [display, setDisplay] = React.useState(0);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!start || started.current) return;
    started.current = true;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [start, value]);

  return (
    <span>
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const hasEntered = useOnScreen(sectionRef);

  return (
    <section className="relative px-4 py-16 sm:px-6">
      <motion.div
        ref={sectionRef}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="mx-auto grid max-w-4xl gap-8 rounded-2xl border border-border bg-card px-6 py-10 sm:grid-cols-3"
      >
        {STATS.map((stat) => (
          <motion.div key={stat.label} variants={slideUp} className="text-center">
            <p className="font-mono text-4xl font-bold tabular-nums text-gradient sm:text-5xl">
              <StatNumber value={stat.value} suffix={stat.suffix} start={hasEntered} />
            </p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
