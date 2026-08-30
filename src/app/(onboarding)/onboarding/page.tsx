export default function OnboardingPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Let&apos;s set up your profile
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This is a placeholder onboarding screen confirming new users land
        here. The real onboarding flow is built in the next phase.
      </p>
    </div>
  );
}
