"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { emailSchema, otpSchema, type EmailFormValues } from "@/lib/validations/auth";
import { fadeIn } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";

const RESEND_COOLDOWN_SECONDS = 30;

type Step = "email" | "otp";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownInterval.current) clearInterval(cooldownInterval.current);
    cooldownInterval.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownInterval.current) clearInterval(cooldownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async (targetEmail: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };

  const onEmailSubmit = async ({ email: submittedEmail }: EmailFormValues) => {
    setIsSendingCode(true);
    try {
      await sendOtp(submittedEmail);
      setEmail(submittedEmail);
      setStep("otp");
      startCooldown();
      toast.success("Code sent", {
        description: `Check ${submittedEmail} for your 6-digit code.`,
      });
    } catch (err) {
      toast.error("Couldn't send code", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyOtp = async (code: string) => {
    const parsed = otpSchema.safeParse({ token: code });
    if (!parsed.success) {
      setOtpError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code");
      return;
    }
    setOtpError(null);
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("Verification succeeded but no user was returned.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      router.refresh();
      router.push(profile ? "/dashboard" : "/onboarding");
    } catch (err) {
      setOtp("");
      setOtpError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsSendingCode(true);
    try {
      await sendOtp(email);
      startCooldown();
      toast.success("Code resent", { description: `Sent a new code to ${email}.` });
    } catch (err) {
      toast.error("Couldn't resend code", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.div
            key="email"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">
                Welcome to CareerPilot AI
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email — we&apos;ll send you a one-time code. No
                password needed.
              </p>
            </div>
            <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSendingCode}>
                {isSendingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending code...
                  </>
                ) : (
                  "Continue with email"
                )}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">
                Enter your code
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="text-foreground">{email}</span>
              </p>
            </div>

            <div className="space-y-6">
              <OtpInput
                length={6}
                value={otp}
                onChange={(v) => {
                  setOtp(v);
                  if (otpError) setOtpError(null);
                }}
                onComplete={verifyOtp}
                disabled={isVerifying}
                autoFocus
              />
              {otpError && (
                <p className="text-center text-xs text-destructive">{otpError}</p>
              )}

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={isVerifying || otp.length !== 6}
                onClick={() => verifyOtp(otp)}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Verify & continue"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setOtpError(null);
                  }}
                  className="flex items-center gap-1 text-muted-foreground transition-colors duration-fast hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isSendingCode}
                  className="text-secondary transition-colors duration-fast hover:text-secondary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
