"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, FileText, Map, Mic, Search } from "lucide-react";

import { staggerContainer, slideUp } from "@/lib/animations";
import type { CompletionItem } from "@/lib/profile-completion";
import { GreetingHeader } from "./greeting-header";
import { StatCard } from "./stat-card";
import { ProfileStrengthCard } from "./profile-strength-card";
import { RecentActivityCard, type AgentActivityRow } from "./recent-activity-card";
import { JobsForYouCard, type JobListingRow } from "./jobs-for-you-card";
import { UpcomingActionsCard } from "./upcoming-actions-card";
import { AgentStatusBar } from "./agent-status-bar";

interface DashboardContentProps {
  fullName: string;
  completionPercent: number;
  completionItems: CompletionItem[];
  stats: {
    resumes: number;
    jobsDiscovered: number;
    applicationsSent: number;
    interviewSessions: number;
  };
  recentActivity: AgentActivityRow[];
  recentJobs: JobListingRow[];
}

const QUICK_ACTIONS = [
  { label: "Find Jobs", icon: Search, href: "/dashboard/jobs" },
  { label: "Practice Interview", icon: Mic, comingSoon: true },
  { label: "Build Resume", icon: FileText, href: "/dashboard/resumes" },
  { label: "View Roadmap", icon: Map, comingSoon: true },
] as const;

export function DashboardContent({
  fullName,
  completionPercent,
  completionItems,
  stats,
  recentActivity,
  recentJobs,
}: DashboardContentProps) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Welcome bar */}
      <motion.div variants={slideUp} className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <GreetingHeader name={fullName} />
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 self-start rounded-md border border-border px-4 py-2 transition-colors duration-fast hover:border-border-strong"
          >
            <span className="text-sm text-muted-foreground">Profile completion</span>
            <span className="font-heading text-sm font-semibold text-secondary">{completionPercent}%</span>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) =>
            "comingSoon" in action && action.comingSoon ? (
              <div
                key={action.label}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background px-3 py-4 text-center opacity-50"
              >
                <action.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">Soon</span>
              </div>
            ) : (
              <Link
                key={action.label}
                href={"href" in action ? action.href : "#"}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background px-3 py-4 text-center transition-colors duration-fast hover:border-primary hover:bg-accent"
              >
                <action.icon className="h-5 w-5 text-secondary" />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </Link>
            )
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={slideUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FileText} label="Resumes in vault" value={stats.resumes} />
        <StatCard icon={Briefcase} label="Jobs discovered" value={stats.jobsDiscovered} />
        <StatCard icon={Search} label="Applications sent" value={stats.applicationsSent} />
        <StatCard icon={Mic} label="Interview sessions" value={stats.interviewSessions} />
      </motion.div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={slideUp} className="space-y-6">
          <ProfileStrengthCard percent={completionPercent} items={completionItems} />
          <RecentActivityCard activities={recentActivity} />
        </motion.div>
        <motion.div variants={slideUp} className="space-y-6">
          <JobsForYouCard jobs={recentJobs} />
          <UpcomingActionsCard />
        </motion.div>
      </div>

      {/* Agent status bar */}
      <motion.div variants={slideUp}>
        <AgentStatusBar />
      </motion.div>
    </motion.div>
  );
}
