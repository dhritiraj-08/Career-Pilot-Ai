import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface ActionItem {
  label: string;
  href: string;
}

// Both "Run Radar" and "Practice an interview" used to be hardcoded
// coming-soon here long after those agents actually shipped.
const ACTIONS: ActionItem[] = [
  { label: "Complete your profile", href: "/dashboard/profile" },
  { label: "Upload your resume", href: "/dashboard/resumes" },
  { label: "Run Radar", href: "/dashboard/jobs" },
  { label: "Practice with Mentor", href: "/dashboard/interview" },
];

export function UpcomingActionsCard() {
  return (
    <div className="card-hover rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold text-foreground">Upcoming actions</h3>
      <ul className="mt-4 space-y-1">
        {ACTIONS.map((action) => (
          <li key={action.label}>
            <Link
              href={action.href}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-secondary" /> {action.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
