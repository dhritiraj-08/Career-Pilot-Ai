import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export type EmailFormValues = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  token: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "Code must be numeric"),
});

export type OtpFormValues = z.infer<typeof otpSchema>;
