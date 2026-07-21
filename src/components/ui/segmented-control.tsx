/**
 * SegmentedControl — pill container with a spring-driven sliding indicator.
 *
 * Rationale:
 * - Uses framer-motion `layoutId` so the indicator morphs between options
 *   with a spring feel (Apple-like), instead of a hard tab swap.
 * - Container mimics an iOS segmented control: subtle track, single pill on
 *   top; low visual weight so it sits under toolbars without shouting.
 * - Icons are optional; labels are always shown to keep affordance clear.
 */
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
  ariaLabel,
}: Props<T>) {
  const groupId = React.useId();
  const heights = size === "sm" ? "h-8 text-xs" : "h-9 text-sm";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-full border border-border bg-muted/40 p-1 shadow-soft-1",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3 font-medium transition-colors duration-200 ease-ios",
              heights,
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-pill-${groupId}`}
                className="absolute inset-0 rounded-full bg-background shadow-soft-2 ring-1 ring-border"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
