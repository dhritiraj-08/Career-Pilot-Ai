import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CalloutVariant = "tip" | "power" | "warning" | "success" | "info";

const VARIANT_STYLES: Record<CalloutVariant, { border: string; bg: string; title: string; label: string }> = {
  tip: { border: "border-primary", bg: "bg-primary/5", title: "text-primary", label: "💡 Pro Tip" },
  power: { border: "border-secondary", bg: "bg-secondary/5", title: "text-secondary", label: "⚡ Power User Tip" },
  warning: { border: "border-warning", bg: "bg-warning/5", title: "text-warning", label: "⚠️ Don't" },
  success: { border: "border-success", bg: "bg-success/5", title: "text-success", label: "✅ Do" },
  info: { border: "border-border-strong", bg: "bg-accent/40", title: "text-foreground", label: "" },
};

interface CalloutProps {
  variant: CalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Shared styled box for pro-tip / do / don't / warning callouts used
 * throughout the Help guide — gradient-adjacent left border + tinted
 * background, per the design spec. */
export function Callout({ variant, title, children, className }: CalloutProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <div className={cn("my-4 rounded-lg border-l-4 px-4 py-3.5 text-sm text-muted-foreground", style.border, style.bg, className)}>
      {(title || style.label) && (
        <p className={cn("mb-1.5 font-semibold", style.title)}>{title ?? style.label}</p>
      )}
      <div className="space-y-1.5 leading-relaxed">{children}</div>
    </div>
  );
}
