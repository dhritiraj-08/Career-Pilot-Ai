import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { CompletionRing } from "@/components/profile/completion-ring";
import type { CompletionItem } from "@/lib/profile-completion";

interface ProfileStrengthCardProps {
  percent: number;
  items: CompletionItem[];
}

export function ProfileStrengthCard({ percent, items }: ProfileStrengthCardProps) {
  const missing = items.filter((item) => !item.done);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold text-foreground">Your profile strength</h3>

      <div className="mt-4 flex items-center gap-4">
        <CompletionRing percent={percent} size={64} />
        <p className="text-sm text-muted-foreground">
          {missing.length === 0
            ? "Your profile is fully complete. Nice work."
            : `${missing.length} thing${missing.length === 1 ? "" : "s"} left to complete your profile.`}
        </p>
      </div>

      {missing.length > 0 ? (
        <ul className="mt-4 space-y-1">
          {missing.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground"
              >
                {item.label}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-sm text-success">
          <Check className="h-4 w-4" /> All set
        </div>
      )}
    </div>
  );
}
