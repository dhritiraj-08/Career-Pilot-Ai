import { LandingHero } from "@/components/marketing/landing-hero";

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
      <LandingHero />
    </main>
  );
}
