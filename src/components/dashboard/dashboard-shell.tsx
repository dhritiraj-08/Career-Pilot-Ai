"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, LayoutDashboard, Map, Menu, MessageSquare, Sparkles, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Resumes", href: "/dashboard/resumes", icon: FileText },
  { label: "Resume Architect", href: "/dashboard/resume-architect", icon: Sparkles },
  { label: "Jobs", href: "/dashboard/jobs", icon: Briefcase, comingSoon: true },
  { label: "Interview", href: "/dashboard/interview", icon: MessageSquare, comingSoon: true },
  { label: "Roadmap", href: "/dashboard/roadmap", icon: Map, comingSoon: true },
];

interface DashboardShellProps {
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ fullName, avatarUrl, email, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  const navLinks = (
    <nav className="flex-1 space-y-1 px-3">
      {NAV_ITEMS.map((item) => {
        if (item.comingSoon) {
          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-60"
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4 w-4" /> {item.label}
              </span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px]">Soon</span>
            </div>
          );
        }

        const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast",
              isActive
                ? "bg-gradient-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userFooter = (
    <div className="mt-auto space-y-3 border-t border-border px-6 pt-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{fullName || "Your name"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <SignOutButton />
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:py-6">
        <Link href="/dashboard" className="mb-8 px-6 font-heading text-lg font-semibold text-foreground">
          CareerPilot <span className="text-secondary">AI</span>
        </Link>
        {navLinks}
        {userFooter}
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="font-heading text-lg font-semibold text-foreground">
          CareerPilot <span className="text-secondary">AI</span>
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
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card py-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between px-6">
              <span className="font-heading text-lg font-semibold text-foreground">
                CareerPilot <span className="text-secondary">AI</span>
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
            {navLinks}
            {userFooter}
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:flex-1">
        <main>{children}</main>
      </div>
    </div>
  );
}
