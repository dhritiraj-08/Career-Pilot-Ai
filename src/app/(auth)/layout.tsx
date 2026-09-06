import { AuthSplitPanel } from "@/components/auth/auth-split-panel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-background">
      <AuthSplitPanel />
      <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden px-4 py-12 lg:w-[40%] lg:bg-card/10">
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          {/* Small screens get the same ambient glow the split panel would otherwise provide. */}
          <div className="glow-ambient absolute inset-0" />
        </div>
        <div className="relative z-10 flex w-full justify-center">{children}</div>
      </div>
    </div>
  );
}
