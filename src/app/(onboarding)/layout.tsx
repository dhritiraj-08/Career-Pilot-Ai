import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * Placeholder shell for Phase 1 — the real onboarding wizard lands next.
 * Session-dependent like the dashboard shell, so force-dynamic here too.
 */
export const dynamic = "force-dynamic";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-heading text-lg font-semibold text-foreground">
          CareerPilot <span className="text-secondary">AI</span>
        </span>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
