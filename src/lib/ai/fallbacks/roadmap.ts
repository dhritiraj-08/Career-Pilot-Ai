import type { GoalType } from "@/lib/validations/roadmap";
import type { GeneratedWeek } from "@/lib/validations/roadmap";

// Generic but real, actionable weekly templates per goal type — not
// fabricated claims about the candidate, just a reasonable structure
// used only if AI generation fails outright. Each template repeats
// its themes across however many weeks were requested (a real
// timeframe still gets a plan, just a less personalized one) rather
// than hard-coding a fixed length.
const TEMPLATES: Record<GoalType, { focusArea: string; tasks: string[] }[]> = {
  job: [
    { focusArea: "Resume & profile readiness", tasks: ["Update your resume with your most recent, quantified achievements", "Tailor your LinkedIn headline and summary to your target role", "Identify 3-5 target companies or job boards to focus on"] },
    { focusArea: "Skill gap closing", tasks: ["List the top 3 skills your target roles ask for that you're weakest on", "Spend focused time this week on the single biggest gap", "Update your resume/portfolio to reflect what you practiced"] },
    { focusArea: "Applying", tasks: ["Apply to 5-10 roles that genuinely match your background", "Customize your resume and a short note for each application", "Track every application in one place (status, date, contact)"] },
    { focusArea: "Networking & interview prep", tasks: ["Reach out to 3 people in your target companies or field", "Practice answering common interview questions for your target role out loud", "Do one mock interview (with a friend, mentor, or CareerPilot AI's Interview Agent)"] },
  ],
  skill: [
    { focusArea: "Foundations", tasks: ["Identify 2-3 core resources (course, docs, book) and start the first one", "Set up your practice environment", "Complete the first foundational module or chapter"] },
    { focusArea: "Guided practice", tasks: ["Work through structured exercises covering this week's concepts", "Write notes in your own words for anything that didn't click immediately", "Ask for feedback on your practice work if possible"] },
    { focusArea: "Applied practice", tasks: ["Build a small exercise or mini-project using only what you've learned so far", "Debug and fix at least one real problem you hit while building it", "Document what you built and what you learned"] },
    { focusArea: "Consolidation", tasks: ["Review everything covered so far and note what still feels shaky", "Teach or explain one concept to someone else (or write it up) to test your understanding", "Plan your next learning steps beyond this roadmap"] },
  ],
  project: [
    { focusArea: "Scoping", tasks: ["Write a one-paragraph description of what you're building and for whom", "List the core features for a first working version — cut anything non-essential", "Choose your tech stack and set up the project skeleton"] },
    { focusArea: "Core build", tasks: ["Build the single most important feature end to end", "Get the core data flow working, even if the UI is rough", "Commit progress regularly with clear messages"] },
    { focusArea: "Feature completion", tasks: ["Build out the remaining planned features", "Fix the rough edges from earlier weeks", "Write basic tests or at least manually verify each feature works"] },
    { focusArea: "Polish & ship", tasks: ["Clean up the UI/UX and fix any bugs you find", "Deploy it somewhere real people can access it", "Write a short README or post showcasing what you built"] },
  ],
  promotion: [
    { focusArea: "Gap analysis", tasks: ["Write down what the next level actually requires (scope, impact, visibility)", "Identify 2-3 concrete gaps between your current work and that bar", "Share your growth goal with your manager and ask for their read on it"] },
    { focusArea: "Visible impact", tasks: ["Take on one piece of work that's clearly above your current scope", "Proactively identify and propose a fix for a real problem on your team", "Start a running doc of your achievements as they happen"] },
    { focusArea: "Building the case", tasks: ["Keep executing on the higher-scope work from last week", "Get feedback from peers or stakeholders on your recent work", "Draft a summary of your case for promotion using your achievements doc"] },
    { focusArea: "The conversation", tasks: ["Schedule a dedicated conversation with your manager about promotion", "Walk through your case with concrete examples and impact", "Agree on next concrete steps and a realistic timeline"] },
  ],
  career_switch: [
    { focusArea: "Mapping the transition", tasks: ["List your transferable skills from your current field", "Research 3 real job descriptions in the new field and note the gaps", "Identify the single biggest gap to close first"] },
    { focusArea: "Closing the gap", tasks: ["Spend focused time learning or practicing the field's core skill", "Follow 5-10 people or companies in the new field for context", "Start a small project or exercise that demonstrates this new skill"] },
    { focusArea: "Building proof of work", tasks: ["Finish a small, real piece of work in the new field you can show", "Write up or document it so it's shareable", "Update your resume/LinkedIn to reflect this new direction"] },
    { focusArea: "Entering the field", tasks: ["Reach out to 3 people already working in the new field", "Apply to 3-5 roles or opportunities in the new direction", "Reflect on what's working and adjust your plan for the following weeks"] },
  ],
};

export function fallbackRoadmap(goalType: GoalType, weekCount: number): GeneratedWeek[] {
  const template = TEMPLATES[goalType];
  return Array.from({ length: weekCount }, (_, i) => {
    const t = template[i % template.length];
    return { weekNumber: i + 1, focusArea: t.focusArea, tasks: t.tasks };
  });
}
