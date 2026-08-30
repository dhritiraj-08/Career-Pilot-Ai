"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { staggerContainer, slideUp } from "@/lib/animations";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="relative z-10 flex flex-col items-center px-4 text-center"
    >
      <motion.div
        variants={slideUp}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-secondary"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI-powered career copilot
      </motion.div>

      <motion.h1
        variants={slideUp}
        className="max-w-3xl font-heading text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl"
      >
        Land your next role,{" "}
        <span className="bg-gradient-primary bg-clip-text text-transparent">
          faster.
        </span>
      </motion.h1>

      <motion.p
        variants={slideUp}
        className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
      >
        Resume building, job hunting, interview prep, and outreach — run by
        autonomous AI agents built for Indian college students and early
        career professionals. Free while we build.
      </motion.p>

      <motion.div variants={slideUp} className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/login">
          <Button size="lg" className="w-full sm:w-auto">
            Get started free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
