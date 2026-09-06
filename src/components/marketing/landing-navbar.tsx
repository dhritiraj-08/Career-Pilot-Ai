"use client";

import * as React from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Features", href: "#agents" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Reviews", href: "#reviews" },
  { label: "Help", href: "/help" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-shadow duration-base",
        scrolled ? "glass shadow-card" : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-gradient font-heading text-lg font-bold">CareerPilot AI</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-fast hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

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
  );
}
