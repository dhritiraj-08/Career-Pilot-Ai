import type { Metadata } from "next";
import Link from "next/link";

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
    <div className="flex flex-col items-center">
      <Link
        href="/"
        className="mb-10 font-heading text-lg font-semibold tracking-tight text-foreground"
      >
        CareerPilot <span className="text-secondary">AI</span>
      </Link>

      {searchParams.error && (
        <div className="mb-6 w-full max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          That link didn&apos;t work or has expired. Please try again.
        </div>
      )}

      <LoginTabs />

      <p className="mt-10 max-w-sm text-center text-xs text-muted-foreground">
        By continuing, you agree that CareerPilot AI will use your email to
        create or sign in to your account.
      </p>
    </div>
  );
}
