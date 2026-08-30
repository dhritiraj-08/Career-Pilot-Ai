import { z } from "zod";

import {
  SKILL_LEVELS,
  type BasicInfoValues,
  type ExperienceValues,
  type SkillValue,
  type EducationEntryValues,
  type SocialLinksValues,
} from "./onboarding";

// Raw shape requested from the LLM (and produced by the regex fallback in
// the same shape) — every field optional/nullable since neither source
// can be trusted to always populate everything. Parsed leniently below:
// an individual bad field is dropped, not the whole response.
const rawSkillSchema = z.object({
  name: z.string().trim().min(1),
  level: z.enum(SKILL_LEVELS).catch("intermediate"),
});

const rawEducationSchema = z.object({
  institution: z.string().trim().min(1),
  degree: z.string().trim().nullable().optional(),
  field: z.string().trim().nullable().optional(),
  start_year: z.number().int().nullable().optional(),
  end_year: z.number().int().nullable().optional(),
  grade: z.string().trim().nullable().optional(),
});

const rawResumeSchema = z.object({
  full_name: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  current_job_role: z.string().trim().nullable().optional(),
  current_company: z.string().trim().nullable().optional(),
  years_experience: z.number().nullable().optional(),
  bio: z.string().trim().nullable().optional(),
  skills: z.array(rawSkillSchema).nullable().optional(),
  education: z.array(rawEducationSchema).nullable().optional(),
  linkedin_url: z.string().trim().nullable().optional(),
  github_url: z.string().trim().nullable().optional(),
  portfolio_url: z.string().trim().nullable().optional(),
});

export interface ParsedResumeProfile {
  basicInfo: Partial<BasicInfoValues>;
  experience: Partial<ExperienceValues>;
  skills: SkillValue[];
  education: EducationEntryValues[];
  socialLinks: Partial<SocialLinksValues>;
}

const isValidUrl = (value: string) => /^https?:\/\/.+/i.test(value);
const currentYear = new Date().getFullYear();

/**
 * Maps the raw LLM/fallback shape into onboarding's prefill shape.
 * Uses .safeParse so a malformed response degrades to "nothing parsed"
 * (empty prefill, same as the skip-onboarding path) rather than throwing.
 */
export function toOnboardingPrefill(raw: unknown): ParsedResumeProfile {
  const parsed = rawResumeSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};

  const skills: SkillValue[] = (data.skills ?? [])
    .filter((s): s is NonNullable<typeof s> => !!s?.name)
    .map((s) => ({ name: s.name, level: s.level }));

  const education: EducationEntryValues[] = (data.education ?? [])
    .filter((e): e is NonNullable<typeof e> => !!e?.institution)
    .map((e) => ({
      institution: e.institution,
      degree: e.degree || "",
      field: e.field || "",
      start_year:
        e.start_year && e.start_year >= 1970 && e.start_year <= currentYear + 10
          ? e.start_year
          : currentYear,
      end_year:
        e.end_year && e.end_year >= 1970 && e.end_year <= currentYear + 10 ? e.end_year : undefined,
      grade: e.grade || "",
    }));

  return {
    basicInfo: {
      full_name: data.full_name || "",
      phone: data.phone || "",
      city: data.city || "",
      bio: data.bio || "",
    },
    experience: {
      current_job_role: data.current_job_role || "",
      current_company: data.current_company || "",
      years_experience:
        typeof data.years_experience === "number" && data.years_experience >= 0
          ? Math.min(Math.round(data.years_experience), 20)
          : 0,
    },
    skills,
    education,
    socialLinks: {
      linkedin_url: data.linkedin_url && isValidUrl(data.linkedin_url) ? data.linkedin_url : "",
      github_url: data.github_url && isValidUrl(data.github_url) ? data.github_url : "",
      portfolio_url: data.portfolio_url && isValidUrl(data.portfolio_url) ? data.portfolio_url : "",
    },
  };
}
