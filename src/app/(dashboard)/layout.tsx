import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * Placeholder shell for Phase 1. Confirms the auth flow lands
 * authenticated users somewhere real; the actual sidebar/dashboard
 * chrome from docs/folder-structure.md is built in a later phase.
 *
 * Every page under here is per-user and session-dependent, so it must
 * never be statically prerendered — force-dynamic also means `next build`
 * doesn't need real Supabase credentials just to build.
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/dashboard" className="font-heading text-lg font-semibold text-foreground">
          CareerPilot <span className="text-secondary">AI</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard/resumes"
            className="text-sm text-muted-foreground transition-colors duration-fast hover:text-foreground"
          >
            Resumes
          </Link>
          <Link
            href="/dashboard/profile"
            className="text-sm text-muted-foreground transition-colors duration-fast hover:text-foreground"
          >
            Profile
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
