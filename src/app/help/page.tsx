import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Rocket } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { BackgroundOrbs } from "@/components/marketing/background-orbs";
import { HelpSearch } from "@/components/help/help-search";
import { HelpQuickLinks } from "@/components/help/help-quick-links";
import { HelpClient } from "@/components/help/help-client";

export const metadata: Metadata = {
  title: "Help & Guide — CareerPilot AI",
  description: "Everything you need to know to land your dream job with CareerPilot AI's automation.",
};

export default function HelpPage() {
  return (
    <div className="bg-dot-grid relative min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-gradient font-heading text-lg font-bold">CareerPilot AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sign In
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-16 text-center sm:px-6 sm:py-20">
        <BackgroundOrbs />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            How to Use <span className="text-gradient">CareerPilot AI</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Everything you need to know to land your dream job with AI automation.
          </p>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            15 min read
          </div>

          <HelpQuickLinks />

          <div className="mt-8">
            <HelpSearch />
          </div>
        </div>
      </section>

      <HelpClient />
    </div>
  );
}
