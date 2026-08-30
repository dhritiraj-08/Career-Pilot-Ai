import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

interface ActionItem {
  label: string;
  href?: string;
  comingSoon?: boolean;
}

const ACTIONS: ActionItem[] = [
  { label: "Complete your profile", href: "/dashboard/profile" },
  { label: "Upload your resume", href: "/dashboard/resumes" },
  { label: "Run Job Hunter", comingSoon: true },
  { label: "Practice an interview", comingSoon: true },
];

export function UpcomingActionsCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold text-foreground">Upcoming actions</h3>
      <ul className="mt-4 space-y-1">
        {ACTIONS.map((action) =>
          action.comingSoon ? (
            <li
              key={action.label}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground opacity-60"
            >
              <span className="flex items-center gap-2">
                <Circle className="h-4 w-4" /> {action.label}
              </span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px]">Soon</span>
            </li>
          ) : (
            <li key={action.label}>
              <Link
                href={action.href as string}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground"
              >
                <CheckCircle2 className="h-4 w-4" /> {action.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
