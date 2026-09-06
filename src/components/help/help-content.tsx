import Link from "next/link";
import { CheckCircle2, Play, UserPlus } from "lucide-react";

import { AGENTS } from "@/lib/agent-metadata";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Callout } from "./callout";
import { FaqAccordion, type FaqItem } from "./faq-accordion";
import { HelpSection, AgentHelpSection, SubHeading, Step, ScreenshotPlaceholder, ScoreBand } from "./help-primitives";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Are the jobs real or made up?",
    answer: "All jobs come from real job boards (RemoteOK, WeWorkRemotely). They are live listings, not sample or fabricated data.",
  },
  {
    question: "Will Aria actually send emails without my permission?",
    answer: "Never. Every email requires your explicit approval before sending. You review every draft first — Approve, Edit & Approve, or Reject.",
  },
  {
    question: "Is my Gmail data safe?",
    answer: "Yes. We only request the minimum permissions needed to read job-related emails and send replies you approve. We never store your email password, and you can disconnect Gmail at any time.",
  },
  {
    question: "Why is my ATS score low?",
    answer: "ATS score reflects how well your resume matches the specific job description’s keywords. Paste the full job description into Nexus for the most accurate score — a partial JD gives Nexus less to match against.",
  },
  {
    question: "Can I use CareerPilot for internships?",
    answer: "Yes! Enter \"internship\" in your target role and set your preferred work mode. Radar and Aria will find and apply to internship listings the same way they handle full-time roles.",
  },
  {
    question: "What if Autopilot finds no jobs?",
    answer: "Lower the minimum match score to 50%, update your target roles in Profile, and make sure your profile is fully complete (skills and experience matter most for matching).",
  },
  {
    question: "Is CareerPilot free?",
    answer: "Yes, completely free while in beta.",
  },
  {
    question: "Can I use this on mobile?",
    answer: "Yes, CareerPilot is fully mobile responsive — including this guide.",
  },
];

export function HelpContent() {
  return (
    <div>
      {/* ============ 1. QUICK START ============ */}
      <HelpSection id="quick-start" title="Get Started in 5 Minutes">
        <p>The fastest path from a blank account to your first AI-drafted application.</p>

        <div className="space-y-8 pt-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Step number={1} title="Create your account">
              Sign up with just an email and password — no credit card, ever.
            </Step>
            <ScreenshotPlaceholder label="Sign up screen" />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Step number={2} title="Complete your profile">
              Upload an existing resume in Resume Vault and let Nexus auto-fill it, or fill it in manually — whichever is faster for you.
            </Step>
            <ScreenshotPlaceholder label="Profile setup" />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Step number={3} title="Set your job preferences">
              Target role, salary range, location, and work mode — this is what Radar and Aria search against.
            </Step>
            <ScreenshotPlaceholder label="Preferences form" />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Step number={4} title="Run Aria Autopilot">
              One click — Aria searches, tailors your resume per job, and drafts applications automatically.
            </Step>
            <ScreenshotPlaceholder label="Autopilot dashboard" />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Step number={5} title="Review and approve">
              Nothing sends without you. Approve, edit, or skip each drafted application.
            </Step>
            <ScreenshotPlaceholder label="Approval cards" />
          </div>
        </div>
      </HelpSection>

      {/* ============ 2. PROFILE ============ */}
      <HelpSection id="profile" title="Setting Up Your Profile">
        <p>Your profile is what every agent reads from — the more complete it is, the better every AI result gets.</p>

        <SubHeading>Basic Info</SubHeading>
        <p>Name, phone, city, bio, and current role/company. This grounds every AI-generated email and cover letter in who you actually are.</p>

        <SubHeading>Skills</SubHeading>
        <p>Add skills with a proficiency level (beginner / intermediate / advanced / expert). This is the single biggest factor in how Radar scores a job match and how Nexus picks what to highlight — an incomplete skills list is the most common reason match scores look lower than expected.</p>

        <SubHeading>Education</SubHeading>
        <p>Degrees, CGPA, and institutions. Shows up in your tailored resume and gives Mentor and Atlas context for entry-level vs. experienced framing.</p>

        <SubHeading>Certifications</SubHeading>
        <p>Add certifications with their credential URLs so they’re verifiable and ready to drop into a tailored resume.</p>

        <SubHeading>Preferences</SubHeading>
        <p>Target roles, salary range, work mode, and notice period. Every one of these directly changes matching: target roles are what Radar searches for, salary range affects a listing’s match score, work mode filters out anything that doesn’t fit, and notice period shows up in outreach emails Hermes drafts on your behalf.</p>

        <SubHeading>Links</SubHeading>
        <p>LinkedIn, GitHub, and Portfolio. Recruiters check these, and Nexus includes them in generated resumes and cover letters when present.</p>

        <SubHeading>Profile Completion</SubHeading>
        <p>The completion percentage on your dashboard tracks how much of the above is actually filled in. It isn’t just a vanity metric — every agent reads from these same fields, so a profile stuck at 40% gives the AI far less to work with than one at 100%.</p>

        <Callout variant="tip">
          Upload your existing resume in Resume Vault and let Nexus auto-fill your profile — much faster than typing everything in by hand.
        </Callout>
      </HelpSection>

      {/* ============ 3. RESUME VAULT ============ */}
      <HelpSection id="resume-vault" title="Managing Your Resumes with Resume Vault">
        <p>Resume Vault is where every resume file you upload lives — the source material every other agent works from.</p>

        <SubHeading>Uploading a resume</SubHeading>
        <p>Go to Resumes in the sidebar and upload a PDF. It’s stored securely and its text is extracted automatically the first time an agent needs to read it.</p>

        <SubHeading>Setting a primary resume</SubHeading>
        <p>Mark one resume as Primary. This is the one Aria uses by default when tailoring applications and prepping interviews, so keep your strongest, most current resume set as primary.</p>

        <SubHeading>Why multiple resumes help</SubHeading>
        <p>Keeping a couple of variants (e.g. one frontend-focused, one full-stack-focused) lets you pick the closer starting point when using Nexus or Mentor directly, rather than relying on AI tailoring to bridge a bigger gap.</p>

        <Callout variant="tip">
          Keep your primary resume genuinely up to date — every AI-generated draft is only as strong as the resume text it’s tailoring.
        </Callout>
      </HelpSection>

      {/* ============ 4. NEXUS ============ */}
      <AgentHelpSection id="nexus" title="Nexus — AI Resume Intelligence" icon={AGENTS["resume-architect"].icon}>
        <p>Nexus analyzes your resume against a specific job description, scores it, and generates a tailored resume and cover letter.</p>

        <SubHeading>How to use it</SubHeading>
        <div className="space-y-3 pt-1">
          <Step number={1} title="Select your resume" />
          <Step number={2} title="Enter the target role" />
          <Step number={3} title="Paste the full job description" />
          <Step number={4} title="Click Analyze & Generate" />
          <Step number={5} title="Review your ATS score and what it means" />
          <Step number={6} title="Download the tailored resume and cover letter" />
        </div>

        <SubHeading>Understanding your ATS score</SubHeading>
        <p>
          <span className="font-mono text-secondary">ATS</span> (Applicant Tracking System) is the software most companies use to
          automatically filter resumes before a human ever sees them — usually by keyword and skill matching against the job
          description. Your score is a breakdown of how well your resume matches that specific posting, not a general resume quality
          score.
        </p>
        <ul className="space-y-2 pt-1">
          <ScoreBand color="success" range="80%+" label="Strong match — you’re well aligned with this role." />
          <ScoreBand color="warning" range="60–79%" label="Good, but needs improvement — check the missing keywords below." />
          <ScoreBand color="destructive" range="Below 60%" label="Significant gaps — this role may need real upskilling, not just resume tweaks." />
        </ul>

        <SubHeading>Keywords found vs. missing</SubHeading>
        <p>Found keywords are terms from the job description Nexus confirmed are already in your resume. Missing keywords are terms the job explicitly wants that your resume doesn’t mention — if you genuinely have that skill, add it; if you don’t, that’s a real gap worth closing (see Atlas below) rather than papering over.</p>

        <SubHeading>Using the recommendations</SubHeading>
        <p>Each recommendation is a specific, actionable change — reordering a section, quantifying an achievement, adding a missing skill — not generic advice. Work through them before you download the final version.</p>

        <Callout variant="tip">Always paste the full job description, not just the title — Nexus can only match what it can actually read.</Callout>
      </AgentHelpSection>

      {/* ============ 5. RADAR ============ */}
      <AgentHelpSection id="radar" title="Radar — Opportunity Scanner" icon={AGENTS["job-hunter"].icon}>
        <p>Radar searches live job boards — RemoteOK and WeWorkRemotely — for roles matching your profile. These are real, currently-open listings, not samples.</p>

        <SubHeading>Filters</SubHeading>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-medium text-foreground">Work mode</span> — Remote, Hybrid, or Onsite.</li>
          <li><span className="font-medium text-foreground">Role</span> — be specific (&ldquo;Backend Engineer&rdquo; finds better matches than &ldquo;Engineer&rdquo;).</li>
          <li><span className="font-medium text-foreground">Location</span> — a city, or &ldquo;Remote&rdquo;.</li>
          <li><span className="font-medium text-foreground">Minimum salary</span> — listings below this are scored down, not hidden entirely.</li>
          <li><span className="font-medium text-foreground">India-friendly filter</span> — hides listings that explicitly restrict hiring to a region that excludes India (e.g. &ldquo;US/Canada only&rdquo;).</li>
        </ul>

        <SubHeading>Understanding match scores</SubHeading>
        <p>Each score blends how well your skills, target role, location, and salary expectations line up with that specific listing — it’s the same scoring engine Aria uses to decide what’s worth drafting an application for.</p>
        <ul className="space-y-2 pt-1">
          <ScoreBand color="success" range="80%+" label="Strong match — apply immediately." />
          <ScoreBand color="warning" range="60–79%" label="Good match — tailor your resume with Nexus first." />
          <ScoreBand color="destructive" range="Below 60%" label="Consider skipping, unless the role itself is a stretch you want to take." />
        </ul>
        <p><span className="font-medium text-foreground">Missing Skills</span> on a job card lists what the listing asks for that isn’t in your profile yet — the same signal Nexus uses.</p>

        <SubHeading>What each action does</SubHeading>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-medium text-foreground">View Details</span> — the full description, requirements, and salary range.</li>
          <li><span className="font-medium text-foreground">Save Job</span> — keep it for later without applying yet.</li>
          <li><span className="font-medium text-foreground">Apply</span> — opens the real listing on its original job board.</li>
          <li><span className="font-medium text-foreground">Generate Tailored Resume</span> — jumps to Nexus with this job’s description already filled in.</li>
        </ul>

        <Callout variant="info" title="A note on sources">
          Radar only ever shows real listings pulled live from RemoteOK and WeWorkRemotely — nothing is fabricated or simulated.
        </Callout>
      </AgentHelpSection>

      {/* ============ 6. ARIA ============ */}
      <AgentHelpSection id="aria" title="Aria — Career Autopilot" icon={AGENTS.autopilot.icon}>
        <p>Aria is the star feature — it connects every other agent into one pipeline: search, tailor, draft, and (once you approve) send.</p>

        <SubHeading>Setting parameters</SubHeading>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-medium text-foreground">Minimum match score</span> — recommended 60–70% to start.</li>
          <li><span className="font-medium text-foreground">Max applications per day</span> — start with 3–5 and raise it once you trust the drafts.</li>
          <li><span className="font-medium text-foreground">Target roles</span> — pulled directly from your Profile preferences.</li>
        </ul>

        <SubHeading>Running Autopilot</SubHeading>
        <div className="space-y-3 pt-1">
          <Step number={1} title="Set your parameters and save them" />
          <Step number={2} title="Click Run Career Autopilot" />
          <Step number={3} title="Watch the Activity Feed for live progress" />
          <Step number={4} title="Wait for approval cards to appear in the Notification Center" />
        </div>

        <SubHeading>The approval system</SubHeading>
        <p>Nothing Aria drafts is ever sent automatically — every application waits for your explicit decision first. This is deliberate: an AI agent should never have unsupervised access to send email on your behalf.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-medium text-success">Approve</span> — sends the draft immediately, as-is.</li>
          <li><span className="font-medium text-secondary">Edit & Approve</span> — make changes, then send.</li>
          <li><span className="font-medium text-destructive">Reject</span> — skips this job; nothing is sent.</li>
        </ul>

        <SubHeading>What happens after you approve</SubHeading>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The application email is sent to the recruiter (or the listing’s contact, if one was found).</li>
          <li>Mentor automatically creates an interview prep session for that exact role.</li>
          <li>Atlas automatically creates a career roadmap for that exact role.</li>
        </ul>

        <Callout variant="tip">
          Start with a 50% threshold the first time, just to see what Aria finds — you can always raise it once you’ve seen the quality of the matches.
        </Callout>
        <Callout variant="tip" title="💡 Pro Tip">
          Update your target roles in Profile before your first run — Aria searches against exactly what’s saved there.
        </Callout>
        <Callout variant="warning" title="⚠️ Heads up">
          Connect Gmail first for full functionality — without it, Aria can still find jobs and write drafts, but can’t send anything.
        </Callout>
        <Callout variant="info" title="Most jobs use a web form, not email">
          When no recruiter email is found on a listing, use the <span className="font-medium text-foreground">Apply via link</span> button on the approval card instead — it opens the real listing so you can apply there directly.
        </Callout>
      </AgentHelpSection>

      {/* ============ 7. MENTOR ============ */}
      <AgentHelpSection id="mentor" title="Mentor — Interview Coach AI" icon={AGENTS.interview.icon}>
        <p>Mentor runs realistic mock interviews tailored to a specific role and resume, then scores your answers with real feedback.</p>

        <SubHeading>Interview types</SubHeading>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-medium text-foreground">Technical</span> — coding and system design questions.</li>
          <li><span className="font-medium text-foreground">HR</span> — behavioral and situational questions.</li>
          <li><span className="font-medium text-foreground">Mixed</span> — a combination of both.</li>
        </ul>

        <SubHeading>Starting an interview</SubHeading>
        <div className="space-y-3 pt-1">
          <Step number={1} title="Select your resume" />
          <Step number={2} title="Enter the target role" />
          <Step number={3} title="Paste the job description" />
          <Step number={4} title="Choose interview type and question count" />
          <Step number={5} title="Click Start Interview" />
        </div>

        <SubHeading>During the interview</SubHeading>
        <p><span className="font-medium text-foreground">Voice mode</span> — click the microphone and speak your answer. <span className="font-medium text-foreground">Text mode</span> — type it instead. There’s no strict timer — take the time you need to think.</p>

        <SubHeading>Understanding your results</SubHeading>
        <p>You get an overall score, a technical score, a communication score, feedback on every individual question, and concrete recommendations for improvement — not just a number.</p>

        <SubHeading>How Aria auto-creates sessions</SubHeading>
        <p>When you approve a job application in Autopilot, Mentor automatically creates an interview prep session for that exact role — no setup needed, it’s waiting for you in Mentor’s session list.</p>

        <Callout variant="tip">Practice the same role more than once — your score and feedback improve the more you actually use the feedback given.</Callout>
        <Callout variant="tip" title="💡 No microphone?">Use text mode — every question and scoring path works identically either way.</Callout>
      </AgentHelpSection>

      {/* ============ 8. HERMES ============ */}
      <AgentHelpSection id="hermes" title="Hermes — Communication Agent" icon={AGENTS.email.icon}>
        <p>Hermes connects to your Gmail to categorize job-related email, draft replies, and compose new outreach — all with your review before anything sends.</p>

        <SubHeading>Connecting Gmail</SubHeading>
        <div className="space-y-3 pt-1">
          <Step number={1} title="Click Connect Gmail" />
          <Step number={2} title="Sign in with your Google account" />
          <Step number={3} title="Grant the requested permissions" />
          <Step number={4} title="Gmail is now connected" />
        </div>

        <SubHeading>Email categories</SubHeading>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-medium text-foreground">Recruiter Emails</span> — cold outreach from recruiters.</li>
          <li><span className="font-medium text-foreground">Interview Invites</span> — scheduling requests.</li>
          <li><span className="font-medium text-foreground">Offer Letters</span> — job offers you’ve received.</li>
          <li><span className="font-medium text-foreground">Rejections</span> — rejection emails.</li>
          <li><span className="font-medium text-foreground">Follow-ups Needed</span> — applications with no reply after 7 days.</li>
        </ul>

        <SubHeading>Syncing</SubHeading>
        <p>Click Sync Now any time to pull in the latest job-related mail — Hermes filters for relevance first, so your inbox isn’t dumped in wholesale.</p>

        <SubHeading>Reading and replying</SubHeading>
        <p>Expand an email to read it in full. An AI-suggested reply is generated automatically — edit it if you want, then click Send to send it through your own connected Gmail account.</p>

        <SubHeading>Composing new emails</SubHeading>
        <p>Job Application, Follow-up, Thank You, and Cold Outreach — pick a type, give Hermes some context, and it drafts a full email for you to review.</p>

        <Callout variant="tip">
          Select your resume and add a few key highlights before generating — the more real context Hermes has, the less generic the draft.
        </Callout>
      </AgentHelpSection>

      {/* ============ 9. ATLAS ============ */}
      <AgentHelpSection id="atlas" title="Atlas — Career Navigator" icon={AGENTS.roadmap.icon}>
        <p>Atlas turns a career goal into a concrete week-by-week plan, and tracks your progress against it.</p>

        <SubHeading>Creating your first goal</SubHeading>
        <div className="space-y-3 pt-1">
          <Step number={1} title="Click Set a New Goal" />
          <Step number={2} title="Enter a goal title and description" />
          <Step number={3} title="Set a target date" />
          <Step number={4} title="Choose a goal type" />
          <Step number={5} title="Click Generate Roadmap with AI" />
        </div>

        <SubHeading>Reading your roadmap</SubHeading>
        <p>Your plan is broken into weeks with a focus area and specific tasks each. The current week is highlighted automatically, and completed weeks collapse out of the way so you’re always looking at what’s next.</p>

        <SubHeading>XP and progress</SubHeading>
        <p>Every completed task earns XP (shown on your profile and sidebar), and the progress ring on each goal fills in as you go — finishing every task on a roadmap marks the whole goal achieved.</p>

        <SubHeading>How Aria auto-creates roadmaps</SubHeading>
        <p>When you approve a job application in Autopilot, Atlas automatically builds a roadmap for that specific role and company — including the real job description, not a generic template.</p>
      </AgentHelpSection>

      {/* ============ 10. TIPS ============ */}
      <HelpSection id="tips" title="Pro Tips for Maximum Results">
        <Callout variant="success" title="✅ Do">
          <ul className="list-disc space-y-1 pl-5">
            <li>Complete your profile 100% before running Autopilot.</li>
            <li>Upload your best resume to Resume Vault.</li>
            <li>Connect Gmail for full email automation.</li>
            <li>Set realistic target roles matching your actual experience.</li>
            <li>Review every AI draft before approving.</li>
            <li>Practice with Mentor before real interviews.</li>
            <li>Update your profile as you gain new skills.</li>
          </ul>
        </Callout>

        <Callout variant="warning" title="❌ Don’t">
          <ul className="list-disc space-y-1 pl-5">
            <li>Set the match threshold too high (above 80%) — you’ll miss good opportunities.</li>
            <li>Approve applications without reading the draft.</li>
            <li>Skip the job description when using Nexus.</li>
            <li>Ignore Mentor’s feedback — it’s specific and accurate.</li>
            <li>Apply to roles too senior for your current experience.</li>
          </ul>
        </Callout>

        <Callout variant="power" title="⚡ Power User Tips">
          <ul className="list-disc space-y-1 pl-5">
            <li>Run Radar first to see what skills are actually in demand for your target role.</li>
            <li>Use Nexus’s missing-keywords list to identify real skill gaps from job descriptions.</li>
            <li>Let Aria run daily for a consistent application pipeline.</li>
            <li>Use Atlas to build exactly the skills Radar says you’re missing.</li>
            <li>Check Hermes daily so recruiter responses don’t sit unanswered.</li>
          </ul>
        </Callout>
      </HelpSection>

      {/* ============ 11. FAQ ============ */}
      <HelpSection id="faq" title="Frequently Asked Questions">
        <FaqAccordion items={FAQ_ITEMS} />
      </HelpSection>

      {/* ============ 12. DEMO ============ */}
      <HelpSection id="demo" title="Watch CareerPilot in Action">
        <div className="glow-ambient relative overflow-hidden rounded-2xl border border-border bg-gradient-surface p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
            <Play className="ml-1 h-6 w-6 fill-primary-foreground text-primary-foreground" />
          </div>
          <p className="mt-4 font-heading text-lg font-semibold text-foreground">Demo video coming soon</p>
          <p className="mt-1 text-sm text-muted-foreground">In the meantime, explore the platform yourself — every feature above is live.</p>
          <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "mt-6 shadow-glow")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Start For Free
          </Link>
        </div>
      </HelpSection>

      <p className="flex items-center gap-2 pt-10 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        You’ve reached the end of the guide — happy job hunting.
      </p>
    </div>
  );
}
