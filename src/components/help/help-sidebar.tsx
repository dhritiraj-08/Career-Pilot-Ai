"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { HELP_SECTIONS } from "@/lib/help-sections";
import { scrollToHelpSection, HELP_SCROLL_OFFSET } from "./scroll-to-section";

interface HelpSidebarProps {
  onNavigate?: () => void;
}

export function HelpSidebar({ onNavigate }: HelpSidebarProps) {
  const [activeId, setActiveId] = React.useState(HELP_SECTIONS[0].id);

  React.useEffect(() => {
    const onScroll = () => {
      let current = HELP_SECTIONS[0].id;
      for (const section of HELP_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - HELP_SCROLL_OFFSET <= 0) {
          current = section.id;
        }
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="space-y-0.5">
      {HELP_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => {
            scrollToHelpSection(section.id);
            onNavigate?.();
          }}
          className={cn(
            "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-fast",
            activeId === section.id
              ? "bg-gradient-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
