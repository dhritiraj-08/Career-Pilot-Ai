import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { LandingHero } from "@/components/marketing/landing-hero";
import { AgentShowcaseSection } from "@/components/marketing/agent-showcase-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { DemoSection } from "@/components/marketing/demo-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { TestimonialCarousel } from "@/components/marketing/testimonial-carousel";
import { LandingFooter } from "@/components/marketing/landing-footer";

export default function LandingPage() {
  return (
    <div className="bg-dot-grid relative min-h-screen overflow-x-hidden bg-background">
      <LandingNavbar />
      <main>
        <LandingHero />
        <AgentShowcaseSection />
        <HowItWorksSection />
        <DemoSection />
        <section id="reviews" className="px-4 py-8 sm:px-6">
          <StatsSection />
          <div className="mt-16">
            <TestimonialCarousel />
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
