"use client";

import { cn } from "@/lib/utils";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A single styled native range input rather than @radix-ui/react-slider
 * (not part of the approved dependency list) — accent-color plus a
 * gradient track fill gives a clean cross-browser look for free.
 */
export function Slider({ min = 0, max = 100, step = 1, value, onChange, disabled, className }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full accent-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        background: `linear-gradient(to right, hsl(var(--primary)) ${percent}%, hsl(var(--card)) ${percent}%)`,
      }}
    />
  );
}
