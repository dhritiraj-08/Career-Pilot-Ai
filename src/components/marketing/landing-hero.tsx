"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { staggerContainer, slideUp } from "@/lib/animations";
import { AGENT_LIST } from "@/lib/agent-metadata";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BackgroundOrbs } from "./background-orbs";

const ACTIVITY_LINES = [
  "Radar found 4 new matches",
  "Nexus tailored your resume — 87% ATS",
  "Mentor scored your last answer 9/10",
  "Hermes drafted a follow-up email",
  "Atlas updated your 4-week plan",
  "Aria is drafting 2 applications",
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      <BackgroundOrbs />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="text-center lg:text-left">
          <motion.div
            variants={slideUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            AI-Powered Career Operating System
          </motion.div>

          <motion.h1
            variants={slideUp}
            className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Land Your Dream Job
            <br />
            <span className="text-gradient">On Autopilot</span>
          </motion.h1>

          <motion.p variants={slideUp} className="mx-auto mt-6 max-w-lg text-base text-muted-foreground sm:text-lg lg:mx-0">
            CareerPilot AI agents build your resume, hunt jobs, prep you for interviews, and apply — while you focus on what matters.
          </motion.p>

          <motion.div variants={slideUp} className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "w-full shadow-glow sm:w-auto")}>
              Start For Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a href="#how-it-works" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
              See How It Works
            </a>
          </motion.div>

          <motion.p variants={slideUp} className="mt-5 text-xs text-muted-foreground">
            Free forever · No credit card · Setup in 2 min
          </motion.p>
        </motion.div>

        {/* Hero visual — a stylized "live" agent activity panel, not a
           literal screenshot (none exists to use honestly). */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.2, 0, 0, 1] }}
          className="glass glow-ambient relative mx-auto w-full max-w-md rounded-2xl p-5 shadow-card"
        >
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <span className="ml-2 font-mono text-xs text-muted-foreground">aria — live</span>
          </div>
          <div className="space-y-2.5">
            {AGENT_LIST.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary">
                  <agent.icon className="h-4 w-4 text-primary-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{ACTIVITY_LINES[i]}</p>
                </div>
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-success" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
