"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { toast } from "sonner";

import { staggerContainer, slideUp } from "@/lib/animations";
import { AGENT_LIST } from "@/lib/agent-metadata";

export function DemoSection() {
  return (
    <section className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2 variants={slideUp} className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See CareerPilot in Action
          </motion.h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto mt-12 max-w-4xl"
        >
          <div className="glow-ambient absolute -inset-4 -z-10 rounded-3xl" />
          <button
            type="button"
            onClick={() => toast.info("Demo video coming soon", { description: "For now, sign up and watch Aria run live." })}
            className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-gradient-surface shadow-card"
          >
            <div className="relative aspect-video w-full bg-gradient-to-br from-primary/20 via-background to-secondary/20">
              {/* Faux "product UI" hint behind the play button */}
              <div className="absolute inset-6 grid grid-cols-3 gap-3 opacity-30 sm:inset-10">
                {AGENT_LIST.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2 rounded-lg border border-border-strong bg-card/60 p-3">
                    <agent.icon className="h-4 w-4 text-secondary" />
                    <div className="h-2 flex-1 rounded-full bg-border-strong" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow transition-transform duration-base group-hover:scale-110 sm:h-20 sm:w-20">
                  <Play className="ml-1 h-7 w-7 fill-primary-foreground text-primary-foreground sm:h-8 sm:w-8" />
                </span>
              </div>
            </div>
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">Watch how Aria handles your entire job search</p>
        </motion.div>
      </div>
    </section>
  );
}
