"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  initials: string;
  avatarClass: string;
}

const AVATAR_COLORS = [
  "bg-primary/25 text-primary",
  "bg-secondary/25 text-secondary",
  "bg-success/25 text-success",
  "bg-warning/25 text-warning",
  "bg-indigo-500/25 text-indigo-300",
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Priya S.",
    role: "IIT Delhi · Software Engineer at Razorpay",
    quote: "Aria applied to 23 jobs overnight. Got 4 interview calls within a week. This is insane.",
    initials: "PS",
    avatarClass: AVATAR_COLORS[0],
  },
  {
    name: "Arjun M.",
    role: "NIT Trichy · ML Engineer Intern",
    quote: "Nexus rewrote my resume for each role. My ATS scores went from 45% to 87%. Got shortlisted at Google.",
    initials: "AM",
    avatarClass: AVATAR_COLORS[1],
  },
  {
    name: "Sneha R.",
    role: "BITS Pilani · Product Manager at Flipkart",
    quote: "I was applying manually for months. CareerPilot got me 3 offers in 3 weeks. Mentor coached me perfectly.",
    initials: "SR",
    avatarClass: AVATAR_COLORS[2],
  },
  {
    name: "Rahul K.",
    role: "VIT Vellore · Full Stack at Swiggy",
    quote: "Hermes wrote all my follow-up emails. One recruiter said my outreach was the most professional she'd seen.",
    initials: "RK",
    avatarClass: AVATAR_COLORS[3],
  },
  {
    name: "Ananya P.",
    role: "Jain University · AI Engineer at Sarvam AI",
    quote: "Atlas built me a 6-month roadmap to become an AI Engineer. Followed it and landed a ₹18LPA package.",
    initials: "AP",
    avatarClass: AVATAR_COLORS[4],
  },
];

const AUTO_ADVANCE_MS = 4000;

export function TestimonialCarousel() {
  const [index, setIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [isPaused]);

  const current = TESTIMONIALS[index];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="mx-auto max-w-2xl"
    >
      <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center text-center"
          >
            <div className="flex gap-0.5 text-warning">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-4 text-balance text-lg font-medium text-foreground">&ldquo;{current.quote}&rdquo;</p>
            <div className="mt-6 flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold ${current.avatarClass}`}>
                {current.initials}
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{current.name}</p>
                <p className="text-xs text-muted-foreground">{current.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {TESTIMONIALS.map((t, i) => (
          <button
            key={t.name}
            type="button"
            aria-label={`Show testimonial from ${t.name}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-base ${
              i === index ? "w-6 bg-gradient-primary" : "w-1.5 bg-border-strong hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
