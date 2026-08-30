import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password — CareerPilot AI",
};

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
      <div className="relative z-10 flex w-full justify-center">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
