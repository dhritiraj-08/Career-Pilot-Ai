"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { HELP_SECTIONS } from "@/lib/help-sections";
import { scrollToHelpSection } from "./scroll-to-section";

export function HelpSearch() {
  const [query, setQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? HELP_SECTIONS.filter(
        (s) => s.label.toLowerCase().includes(normalizedQuery) || s.keywords.some((k) => k.includes(normalizedQuery))
      )
    : [];

  const handleSelect = (id: string) => {
    scrollToHelpSection(id);
    setQuery("");
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search the guide..."
          className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_hsl(var(--primary)/0.6),0_0_16px_2px_hsl(var(--secondary)/0.25)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isFocused && normalizedQuery && (
        <div className="glass absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-xl p-1.5 text-left shadow-card">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No sections match &ldquo;{query}&rdquo;.</p>
          ) : (
            results.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSelect(section.id)}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors duration-fast hover:bg-accent"
              >
                {section.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
