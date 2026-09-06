"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, Star } from "lucide-react";

import { AGENT_LIST } from "@/lib/agent-metadata";
import { BackgroundOrbs } from "@/components/marketing/background-orbs";

/**
 * The login page's left-side marketing panel — decorative only, no
 * auth logic. Hidden below `lg` since a 60/40 split makes no sense on
 * a narrow screen; the right panel (the actual form) covers full width
 * there instead.
 */
export function AuthSplitPanel() {
  return (
    <div className="relative hidden w-[60%] flex-col justify-between overflow-hidden border-r border-border bg-card/40 p-10 lg:flex xl:p-14">
      <BackgroundOrbs />

      <Link href="/" className="relative z-10 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
          <Rocket className="h-4 w-4 text-primary-foreground" />
        </span>
        <span className="font-heading text-lg font-bold text-foreground">CareerPilot AI</span>
      </Link>

      <div className="relative z-10 max-w-lg">
        <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-foreground xl:text-5xl">
          Your AI Career Team <span className="text-gradient">Awaits</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Join thousands of students landing dream jobs with AI-powered career automation.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3">
          {AGENT_LIST.map((agent, i) => (
            <motion.div
              key={agent.id}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              className="glass flex items-center gap-2.5 rounded-xl px-3.5 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary">
                <agent.icon className="h-4 w-4 text-primary-foreground" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{agent.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{agent.tagline}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass relative z-10 rounded-xl p-5">
        <div className="flex gap-0.5 text-warning">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>
        <p className="mt-2 text-sm text-foreground">
          &ldquo;Aria applied to 23 jobs overnight. Got 4 interview calls within a week. This is insane.&rdquo;
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Priya S. · IIT Delhi, Software Engineer at Razorpay</p>
      </div>
    </div>
  );
}
