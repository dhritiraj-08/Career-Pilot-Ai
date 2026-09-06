"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListTree, X } from "lucide-react";

import { HelpSidebar } from "./help-sidebar";
import { HelpContent } from "./help-content";
import { ReadingProgressBar } from "./reading-progress-bar";
import { BackToTopButton } from "./back-to-top-button";

export function HelpClient() {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  return (
    <>
      <ReadingProgressBar />

      {/* Mobile: a floating toggle instead of a permanent sidebar column. */}
      <button
        type="button"
        onClick={() => setIsMobileNavOpen(true)}
        className="glass fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground shadow-card lg:hidden"
      >
        <ListTree className="h-4 w-4 text-secondary" />
        Guide sections
      </button>

      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl border-t border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-heading text-sm font-semibold text-foreground">Guide sections</p>
                <button type="button" onClick={() => setIsMobileNavOpen(false)} aria-label="Close" className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <HelpSidebar onNavigate={() => setIsMobileNavOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)]">
            <HelpSidebar />
          </div>
        </aside>
        <div className="min-w-0">
          <HelpContent />
        </div>
      </div>

      <BackToTopButton />
    </>
  );
}
