"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { AGENT_LIST } from "@/lib/agent-metadata";
import { hoverLift } from "@/lib/animations";

/** Every agent is shipped now — this used to hardcode most of them as
 * "coming soon" long after they'd actually launched. Sourced from the
 * shared agent-metadata module so a rename never needs a second edit
 * here. */
export function AgentStatusBar() {
  return (
    <div>
      <h3 className="mb-4 font-heading text-xl font-semibold text-foreground">Your AI Agents</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_LIST.map((agent) => (
          <motion.div key={agent.id} {...hoverLift}>
            <Link
              href={agent.href}
              className="group gradient-border-top relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors duration-fast hover:border-border-strong"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                  <agent.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active
                </span>
              </div>
              <p className="mt-4 font-heading text-lg font-semibold text-foreground">{agent.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{agent.tagline}</p>
              <div className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-secondary opacity-0 transition-opacity duration-fast group-hover:opacity-100">
                Open
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-fast group-hover:translate-x-0.5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
