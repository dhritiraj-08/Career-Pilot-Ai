"use client";

import { motion } from "framer-motion";

import { staggerContainer, slideUp } from "@/lib/animations";
import { AGENT_LIST } from "@/lib/agent-metadata";

export function AgentShowcaseSection() {
  return (
    <section id="agents" className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2 variants={slideUp} className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            6 AI Agents Working For You
          </motion.h2>
          <motion.p variants={slideUp} className="mt-4 text-base text-muted-foreground">
            Each one does a single job well — together, they run your entire job search.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {AGENT_LIST.map((agent) => (
            <motion.div
              key={agent.id}
              variants={slideUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="group gradient-border-top relative rounded-xl border border-border bg-card p-6 transition-colors duration-base hover:border-primary/50 hover:shadow-glow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <agent.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{agent.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{agent.tagline}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-success">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Active
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
