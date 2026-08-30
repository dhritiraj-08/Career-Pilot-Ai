import { z } from "zod";

import { basicInfoSchema, experienceSchema } from "./onboarding";

// The profile page's Overview tab edits Basic Info + Experience as one
// section, so it reuses onboarding's schemas merged into one.
export const overviewSchema = basicInfoSchema.merge(experienceSchema);
export type OverviewValues = z.infer<typeof overviewSchema>;

export const certificationEntrySchema = z.object({
  name: z.string().trim().min(1, "Certification name is required"),
  issuer: z.string().trim().min(1, "Issuer is required"),
  issue_date: z.string().trim().min(1, "Issue date is required"),
  expiry_date: z.string().trim().optional().or(z.literal("")),
  credential_url: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
      message: "Enter a full URL starting with http:// or https://",
    }),
});
export type CertificationEntryValues = z.infer<typeof certificationEntrySchema>;
