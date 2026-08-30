/**
 * Single source of truth for "how complete is this profile" — used by
 * both /dashboard (profile-strength card) and /dashboard/profile
 * (sidebar completion ring), so the two can never disagree on the
 * percentage or the definition of "done."
 */
export interface ProfileCompletionInput {
  hasAvatar: boolean;
  hasBasicInfo: boolean;
  hasExperience: boolean;
  hasSkills: boolean;
  hasEducation: boolean;
  hasJobPreferences: boolean;
  hasSocialLinks: boolean;
}

export interface CompletionItem {
  key: keyof ProfileCompletionInput;
  label: string;
  done: boolean;
  /** Where to send the user to fix this — profile tabs support
   * ?tab=<value> to land directly on the relevant section. */
  href: string;
}

export function computeProfileCompletion(input: ProfileCompletionInput): {
  percent: number;
  items: CompletionItem[];
} {
  const items: CompletionItem[] = [
    { key: "hasAvatar", label: "Add a profile photo", done: input.hasAvatar, href: "/dashboard/profile" },
    {
      key: "hasBasicInfo",
      label: "Fill in your basic info",
      done: input.hasBasicInfo,
      href: "/dashboard/profile?tab=overview",
    },
    {
      key: "hasExperience",
      label: "Add your experience",
      done: input.hasExperience,
      href: "/dashboard/profile?tab=overview",
    },
    { key: "hasSkills", label: "Add your skills", done: input.hasSkills, href: "/dashboard/profile?tab=skills" },
    {
      key: "hasEducation",
      label: "Add your education",
      done: input.hasEducation,
      href: "/dashboard/profile?tab=education",
    },
    {
      key: "hasJobPreferences",
      label: "Set your job preferences",
      done: input.hasJobPreferences,
      href: "/dashboard/profile?tab=preferences",
    },
    {
      key: "hasSocialLinks",
      label: "Add your social links",
      done: input.hasSocialLinks,
      href: "/dashboard/profile?tab=links",
    },
  ];

  const percent = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { percent, items };
}
