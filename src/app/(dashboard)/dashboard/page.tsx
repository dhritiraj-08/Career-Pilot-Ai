export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        You&apos;re in 🎉
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This is a placeholder dashboard confirming the auth flow works
        end-to-end. The real dashboard is built in a later phase.
      </p>
    </div>
  );
}
