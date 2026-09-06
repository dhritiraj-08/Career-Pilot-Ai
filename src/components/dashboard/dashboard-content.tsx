"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, FileText, Map, Mic, Search } from "lucide-react";

import { staggerContainer, slideUp } from "@/lib/animations";
import type { CompletionItem } from "@/lib/profile-completion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GreetingHeader } from "./greeting-header";
import { StatCard } from "./stat-card";
import { ProfileStrengthCard } from "./profile-strength-card";
import { RecentActivityCard, type AgentActivityRow } from "./recent-activity-card";
import { JobsForYouCard, type JobListingRow } from "./jobs-for-you-card";
import { UpcomingActionsCard } from "./upcoming-actions-card";
import { AgentStatusBar } from "./agent-status-bar";

interface DashboardContentProps {
  fullName: string;
  avatarUrl: string | null;
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
  { label: "Practice Interview", icon: Mic, href: "/dashboard/interview" },
  { label: "Build Resume", icon: FileText, href: "/dashboard/resumes" },
  { label: "View Roadmap", icon: Map, href: "/dashboard/roadmap" },
] as const;

export function DashboardContent({
  fullName,
  avatarUrl,
  completionPercent,
  completionItems,
  stats,
  recentActivity,
  recentJobs,
}: DashboardContentProps) {
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Welcome banner */}
      <motion.div variants={slideUp} className="glow-ambient relative overflow-hidden rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="hidden h-14 w-14 shrink-0 ring-2 ring-border sm:flex">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <GreetingHeader name={fullName} />
          </div>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 self-start rounded-lg border border-border bg-background px-4 py-2.5 transition-colors duration-fast hover:border-border-strong"
          >
            <span className="text-sm text-muted-foreground">Profile completion</span>
            <span className="font-mono text-sm font-semibold text-secondary">{completionPercent}%</span>
          </Link>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="card-hover flex flex-col items-center gap-2 rounded-lg border border-border bg-background px-3 py-4 text-center hover:border-primary/60"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <action.icon className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </Link>
          ))}
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

      {/* Agent showcase */}
      <motion.div variants={slideUp}>
        <AgentStatusBar />
      </motion.div>
    </motion.div>
  );
}
