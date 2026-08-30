"use client";

import * as React from "react";

/**
 * Computes the greeting/date on the client only. A Server Component
 * would use the server's clock (likely UTC), which can say "Good
 * evening" to a user for whom it's actually morning. useState's initial
 * value is rendered identically on the server and on the client's first
 * paint, so there's no hydration mismatch — the real greeting swaps in
 * a moment later once mounted.
 */
export function GreetingHeader({ name }: { name: string }) {
  const [greeting, setGreeting] = React.useState("Hello");
  const [dateStr, setDateStr] = React.useState("");

  React.useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
    setDateStr(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  const firstName = name.split(" ")[0];

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        {greeting}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
    </div>
  );
}
