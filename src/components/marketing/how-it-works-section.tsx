"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileUp, MousePointerClick, Rocket } from "lucide-react";

import { staggerContainer, slideUp } from "@/lib/animations";

const STEPS = [
  {
    number: "01",
    icon: FileUp,
    title: "Build Your Profile",
    description: "Upload your resume, add your skills, and set your target roles once.",
  },
  {
    number: "02",
    icon: Rocket,
    title: "Run Aria Autopilot",
    description: "One click starts everything — search, tailoring, and outreach, all at once.",
  },
  {
    number: "03",
    icon: MousePointerClick,
    title: "Review & Approve",
    description: "Every draft waits for you — approve, edit, or skip before anything sends.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Get Hired",
    description: "Interviews, offers, and a roadmap to keep growing after you land the role.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2 variants={slideUp} className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From Profile to Offer in 4 Steps
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Connecting line — desktop only, animates in from the left. */}
          <motion.div
            variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 1, ease: [0.2, 0, 0, 1] } } }}
            style={{ transformOrigin: "left" }}
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-primary lg:block"
          />

          {STEPS.map((step) => (
            <motion.div key={step.number} variants={slideUp} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                <step.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="mt-4 font-mono text-xs text-muted-foreground">STEP {step.number}</span>
              <h3 className="mt-1 font-heading text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
