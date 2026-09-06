import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ImageIcon } from "lucide-react";

/** Section wrapper — id for anchor scrolling, gradient accent bar next
 * to the heading (per spec: "section headers with gradient accent"). */
export function HelpSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-border py-14 first:pt-0 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="h-8 w-1.5 shrink-0 rounded-full bg-gradient-primary" />
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      </div>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{children}</div>
    </section>
  );
}

/** Same as HelpSection but with an agent-branded icon badge instead of
 * the plain gradient bar — used for the six agent deep-dive sections. */
export function AgentHelpSection({ id, title, icon: Icon, children }: { id: string; title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-border py-14 first:pt-0 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </span>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      </div>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{children}</div>
    </section>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="!mt-8 font-heading text-lg font-semibold text-foreground">{children}</h3>;
}

export function Step({ number, title, children }: { number: number; title: string; children?: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-mono text-sm font-bold text-primary-foreground">
        {number}
      </span>
      <div className="pt-0.5">
        <p className="font-semibold text-foreground">{title}</p>
        {children && <p className="mt-1 text-muted-foreground">{children}</p>}
      </div>
    </div>
  );
}

/** Honest placeholder — no fabricated product screenshot exists, so
 * this says exactly what it is rather than faking one. */
export function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-28 w-full shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-card/50 sm:w-44">
      <ImageIcon className="h-5 w-5 text-muted-foreground" />
      <span className="text-center text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <code className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[13px] text-secondary">{children}</code>;
}

export function ScoreBand({ color, range, label }: { color: "success" | "warning" | "destructive"; range: string; children?: ReactNode; label: string }) {
  const dot = color === "success" ? "bg-success" : color === "warning" ? "bg-warning" : "bg-destructive";
  const text = color === "success" ? "text-success" : color === "warning" ? "text-warning" : "text-destructive";
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span>
        <span className={`font-mono font-semibold ${text}`}>{range}</span> — {label}
      </span>
    </li>
  );
}
