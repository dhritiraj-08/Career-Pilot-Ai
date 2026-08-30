import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-heading text-2xl font-semibold text-foreground">{value}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
          <Icon className="h-4 w-4 text-secondary" />
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
