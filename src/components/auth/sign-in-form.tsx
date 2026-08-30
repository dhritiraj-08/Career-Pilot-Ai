"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { signInSchema, type SignInValues } from "@/lib/validations/auth-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ForgotPasswordDialog } from "./forgot-password-dialog";
import { LoginForm } from "./login-form";

export function SignInForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async ({ email, password }: SignInValues) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("Sign in succeeded but no user was returned.");

      // Same "onboarding complete" signal used everywhere else in the
      // app: job_preferences existing, not profiles (see login-form.tsx
      // for why profiles isn't a reliable signal).
      const { data: jobPreferences } = await supabase
        .from("job_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      router.refresh();
      router.push(jobPreferences ? "/dashboard" : "/onboarding");
    } catch (err) {
      toast.error("Couldn't sign in", {
        description:
          err instanceof Error ? err.message : "Check your email and password and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (useMagicLink) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <LoginForm compact />
        <button
          type="button"
          onClick={() => setUseMagicLink(false)}
          className="mx-auto block text-xs text-muted-foreground transition-colors duration-fast hover:text-foreground"
        >
          Use email and password instead
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email address</Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">Password</Label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-secondary transition-colors duration-fast hover:text-secondary/80"
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput id="signin-password" autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setUseMagicLink(true)}
        className="mx-auto block text-xs text-muted-foreground transition-colors duration-fast hover:text-foreground"
      >
        Prefer a sign-in link? Click here
      </button>

      <ForgotPasswordDialog open={showForgotPassword} onOpenChange={setShowForgotPassword} />
    </div>
  );
}
