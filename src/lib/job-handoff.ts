/**
 * One-time cross-page handoff from a Job Hunter listing to Resume
 * Architect ("Build Resume for This Job"). A job description can
 * easily exceed URL length limits, so this goes through sessionStorage
 * instead of a query param — set by the job card, read once and
 * cleared by the Resume Architect form on mount.
 */
const STORAGE_KEY = "careerpilot:resume-architect-prefill";

export interface ResumeArchitectPrefill {
  jobDescription: string;
  targetRole: string;
}

export function setResumeArchitectPrefill(prefill: ResumeArchitectPrefill) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefill));
}

export function consumeResumeArchitectPrefill(): ResumeArchitectPrefill | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.jobDescription === "string" && typeof parsed.targetRole === "string") {
      return parsed;
    }
  } catch {
    // ignore malformed data
  }
  return null;
}
