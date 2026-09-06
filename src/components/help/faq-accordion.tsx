"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question} className="rounded-lg border border-border bg-card">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-foreground">{item.question}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-base", isOpen && "rotate-180")} />
            </button>
            <div
              className="grid overflow-hidden transition-[grid-template-rows] duration-base"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
