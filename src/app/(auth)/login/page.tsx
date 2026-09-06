import type { Metadata } from "next";
import Link from "next/link";

import { AGENT_LIST } from "@/lib/agent-metadata";
import { LoginTabs } from "@/components/auth/login-tabs";

export const metadata: Metadata = {
  title: "Sign in — CareerPilot AI",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex w-full flex-col items-center">
      <Link
        href="/"
        className="mb-8 font-heading text-lg font-semibold tracking-tight text-foreground lg:hidden"
      >
        CareerPilot <span className="text-secondary">AI</span>
      </Link>

      <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Welcome back</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Sign in to keep your agents running.</p>

      {searchParams.error && (
        <div className="mt-6 w-full max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          That link didn&apos;t work or has expired. Please try again.
        </div>
      )}

      <div className="mt-8 w-full">
        <LoginTabs />
      </div>

      <p className="mt-8 max-w-sm text-center text-xs text-muted-foreground">
        By continuing, you agree that CareerPilot AI will use your email to
        create or sign in to your account.
      </p>

      <p className="mt-6 max-w-sm text-center text-[11px] text-muted-foreground">
        Your team: {AGENT_LIST.map((a) => a.name).join(" · ")}
      </p>
    </div>
  );
}
