import { cn } from "@/lib/utils";

/**
 * Slowly drifting blurred gradient blobs — shared by the landing hero
 * and the login page's left panel so both read as one system. Pure
 * decoration: aria-hidden, no interaction, low opacity per the spec
 * (0.15–0.3) so it never competes with foreground content.
 */
export function BackgroundOrbs({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="animate-blob absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div
        className="animate-blob absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="animate-blob absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        style={{ animationDelay: "8s" }}
      />
    </div>
  );
}
