"use client";

import { Check, Loader2, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SectionCardProps {
  title: string;
  description?: string;
  isEditing: boolean;
  isSaving?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

/**
 * Card shell shared by every single-object profile section (Overview,
 * Preferences, Links): a title, an Edit pencil when read-only, and
 * Cancel/Save controls when editing. Always renders a <form> — inert
 * (onSubmit no-ops) in read mode — so the Save button can simply be
 * type="submit" and Enter-to-submit works while editing.
 */
export function SectionCard({
  title,
  description,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSubmit,
  children,
}: SectionCardProps) {
  return (
    <form
      onSubmit={(e) => {
        if (!isEditing) {
          e.preventDefault();
          return;
        }
        onSubmit?.(e);
      }}
      className="rounded-lg border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {!isEditing ? (
          <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${title}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={isSaving}
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button type="submit" variant="ghost" size="icon" disabled={isSaving} aria-label="Save">
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>
      {children}
    </form>
  );
}
