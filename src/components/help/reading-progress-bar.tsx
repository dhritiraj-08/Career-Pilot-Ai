"use client";

import * as React from "react";

export function ReadingProgressBar() {
  const [percent, setPercent] = React.useState(0);

  React.useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setPercent(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full bg-transparent">
      <div className="h-full bg-gradient-primary transition-[width] duration-75" style={{ width: `${percent}%` }} />
    </div>
  );
}
