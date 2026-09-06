"use client";

import type { LucideIcon } from "lucide-react";

import { useCountUp } from "@/lib/use-count-up";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  const displayValue = useCountUp(value);

  return (
    <div className="card-hover rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-3xl font-bold tabular-nums text-foreground">{displayValue}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
