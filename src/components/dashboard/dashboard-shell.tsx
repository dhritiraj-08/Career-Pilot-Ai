"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, HelpCircle, LayoutDashboard, Menu, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { AGENTS } from "@/lib/agent-metadata";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface NavItem {
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: AGENTS.autopilot.name, sublabel: "Autopilot", href: AGENTS.autopilot.href, icon: AGENTS.autopilot.icon },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Resumes", href: "/dashboard/resumes", icon: Briefcase },
  { label: AGENTS["resume-architect"].name, sublabel: "Resume Architect", href: AGENTS["resume-architect"].href, icon: AGENTS["resume-architect"].icon },
  { label: AGENTS["job-hunter"].name, sublabel: "Job Hunter", href: AGENTS["job-hunter"].href, icon: AGENTS["job-hunter"].icon },
  { label: AGENTS.interview.name, sublabel: "Interview", href: AGENTS.interview.href, icon: AGENTS.interview.icon },
  { label: AGENTS.email.name, sublabel: "Email", href: AGENTS.email.href, icon: AGENTS.email.icon },
  { label: AGENTS.roadmap.name, sublabel: "Roadmap", href: AGENTS.roadmap.href, icon: AGENTS.roadmap.icon },
];

const XP_PER_LEVEL = 500;

interface DashboardShellProps {
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  xp: number;
  children: React.ReactNode;
}

function Logo() {
  return (
    <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-6">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
        <span className="font-heading text-sm font-bold text-primary-foreground">C</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-heading text-lg font-bold text-foreground">CareerPilot</span>
        <span className="rounded-full bg-gradient-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
          AI
        </span>
      </span>
    </Link>
  );
}

export function DashboardShell({ fullName, avatarUrl, email, xp, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpPercent = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  const renderNav = (layoutIdPrefix: string) => (
    <nav className="flex-1 space-y-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className="relative block"
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-active-glow`}
                className="absolute inset-0 rounded-lg bg-gradient-primary shadow-glow"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-fast",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate">{item.label}</span>
                {item.sublabel && (
                  <span className={cn("truncate text-[10px] font-normal", isActive ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                    {item.sublabel}
                  </span>
                )}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );

  const userFooter = (
    <div className="mt-auto space-y-3 border-t border-border px-6 pt-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-card">
            {level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{fullName || "Your name"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-accent">
            <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>
      <Link
        href="/help"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground"
      >
        <HelpCircle className="h-4 w-4" />
        Help &amp; Guide
      </Link>
      <SignOutButton />
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card/40 lg:py-6">
        <Logo />
        {renderNav("desktop")}
        {userFooter}
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
            <span className="font-heading text-xs font-bold text-primary-foreground">C</span>
          </span>
          <span className="font-heading text-lg font-semibold text-foreground">CareerPilot</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          className="text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card py-6 shadow-xl"
            >
              <div className="mb-8 flex items-center justify-between px-6">
                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
                    <span className="font-heading text-xs font-bold text-primary-foreground">C</span>
                  </span>
                  <span className="font-heading text-lg font-semibold text-foreground">CareerPilot</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderNav("mobile")}
              {userFooter}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="min-w-0 lg:flex-1">
        <main className="bg-dot-grid">{children}</main>
      </div>
    </div>
  );
}
