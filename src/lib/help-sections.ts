export interface HelpSection {
  id: string;
  label: string;
  /** Terms the search bar matches against, beyond the label itself —
   * this is a lightweight heading/keyword search, not a full-text index
   * of every paragraph on the page. */
  keywords: string[];
}

export const HELP_SECTIONS: HelpSection[] = [
  { id: "quick-start", label: "Get Started in 5 Minutes", keywords: ["quick start", "sign up", "create account", "onboarding"] },
  { id: "profile", label: "Setting Up Your Profile", keywords: ["skills", "education", "certifications", "preferences", "links", "completion", "basic info", "salary", "notice period"] },
  { id: "resume-vault", label: "Resume Vault", keywords: ["upload resume", "primary resume", "vault"] },
  { id: "nexus", label: "Nexus — AI Resume Intelligence", keywords: ["resume architect", "ats score", "ats", "keywords", "cover letter", "tailored resume"] },
  { id: "radar", label: "Radar — Opportunity Scanner", keywords: ["job hunter", "match score", "remoteok", "weworkremotely", "filters", "india-friendly"] },
  { id: "aria", label: "Aria — Career Autopilot", keywords: ["autopilot", "approval", "approve", "reject", "edit & approve", "match threshold", "max applications"] },
  { id: "mentor", label: "Mentor — Interview Coach AI", keywords: ["interview", "technical", "behavioral", "voice mode", "mock interview", "score"] },
  { id: "hermes", label: "Hermes — Communication Agent", keywords: ["email", "gmail", "connect gmail", "compose", "recruiter", "follow-up", "rejection"] },
  { id: "atlas", label: "Atlas — Career Navigator", keywords: ["roadmap", "goal", "xp", "week", "progress ring"] },
  { id: "tips", label: "Pro Tips for Maximum Results", keywords: ["best practices", "do", "don't", "power user"] },
  { id: "faq", label: "Frequently Asked Questions", keywords: ["faq", "questions", "free", "safe", "internship", "mobile"] },
  { id: "demo", label: "Watch CareerPilot in Action", keywords: ["video", "demo"] },
];
