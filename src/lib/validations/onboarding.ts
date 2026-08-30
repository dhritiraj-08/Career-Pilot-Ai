import { z } from "zod";

// Treats "", null, undefined, and NaN (from RHF's valueAsNumber on an
// empty <input type="number">) all as "not provided" before coercion,
// so an optional numeric field doesn't fail validation when left blank.
const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "number" && Number.isNaN(val)) return undefined;
  return val;
}, z.coerce.number().min(0).optional());

// ---------------------------------------------------------------------
// Step 1 — Basic Info
// ---------------------------------------------------------------------
export const basicInfoSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(120),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number"),
  city: z.string().trim().min(1, "City is required").max(100),
  bio: z.string().max(500, "Keep it under 500 characters").optional().or(z.literal("")),
});
export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

// ---------------------------------------------------------------------
// Step 2 — Experience
// ---------------------------------------------------------------------
export const experienceSchema = z.object({
  current_job_role: z.string().max(120).optional().or(z.literal("")),
  current_company: z.string().max(120).optional().or(z.literal("")),
  years_experience: z.number().min(0).max(20),
});
export type ExperienceValues = z.infer<typeof experienceSchema>;

// ---------------------------------------------------------------------
// Step 3 — Skills
// ---------------------------------------------------------------------
export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const skillSchema = z.object({
  name: z.string().trim().min(1),
  level: z.enum(SKILL_LEVELS),
});
export const skillsStepSchema = z.object({
  skills: z.array(skillSchema).min(1, "Add at least one skill"),
});
export type SkillValue = z.infer<typeof skillSchema>;
export type SkillsStepValues = z.infer<typeof skillsStepSchema>;

// ---------------------------------------------------------------------
// Step 4 — Education
// ---------------------------------------------------------------------
const currentYear = new Date().getFullYear();

export const educationEntrySchema = z.object({
  institution: z.string().trim().min(1, "Institution is required"),
  degree: z.string().trim().min(1, "Degree is required"),
  field: z.string().trim().min(1, "Field of study is required"),
  start_year: z.number().min(1970).max(currentYear + 10),
  end_year: z.number().min(1970).max(currentYear + 10).optional(),
  grade: z.string().max(50).optional().or(z.literal("")),
});
export const educationStepSchema = z.object({
  education: z.array(educationEntrySchema).min(1, "Add at least one education entry"),
});
export type EducationEntryValues = z.infer<typeof educationEntrySchema>;
export type EducationStepValues = z.infer<typeof educationStepSchema>;

// ---------------------------------------------------------------------
// Step 5 — Job Preferences
// ---------------------------------------------------------------------
export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

export const NOTICE_PERIODS = [
  "Immediate",
  "15 days",
  "30 days",
  "60 days",
  "90 days",
  "More than 90 days",
] as const;

export const JOB_SEARCH_STATUSES = [
  { value: "active", label: "Actively looking" },
  { value: "passive", label: "Open to opportunities" },
  { value: "not_looking", label: "Not looking" },
] as const;

export const jobPreferencesSchema = z
  .object({
    target_roles: z.array(z.string()).min(1, "Add at least one target role"),
    target_fields: z.array(z.string()).min(1, "Add at least one target field"),
    min_salary: optionalNumber,
    max_salary: optionalNumber,
    currency: z.string().min(1),
    work_mode: z.enum(WORK_MODES).optional(),
    preferred_locations: z.array(z.string()).min(1, "Add at least one preferred location"),
    notice_period: z.string().optional().or(z.literal("")),
    job_search_status: z.enum(["active", "passive", "not_looking"]),
  })
  .refine(
    (data) =>
      data.min_salary === undefined ||
      data.max_salary === undefined ||
      data.max_salary >= data.min_salary,
    { message: "Max salary must be greater than or equal to min salary", path: ["max_salary"] }
  );
export type JobPreferencesValues = z.infer<typeof jobPreferencesSchema>;

// ---------------------------------------------------------------------
// Step 6 — Social Links
// ---------------------------------------------------------------------
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
    message: "Enter a full URL starting with http:// or https://",
  });

export const socialLinksSchema = z.object({
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  portfolio_url: optionalUrl,
});
export type SocialLinksValues = z.infer<typeof socialLinksSchema>;
