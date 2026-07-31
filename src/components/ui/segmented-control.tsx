/**
 * SegmentedControl — pill container with a sliding indicator.
 *
 * Rationale:
 * - The indicator is a single absolutely-positioned pill whose transform is
 *   driven by the active index, so it *slides* between options with a pure CSS
 *   transition (--duration-fast / --ease-ios). No framer-motion needed.
 * - Options share an equal-width track (each is `flex-1` of 1/N) so the
 *   translate math is exact.
 * - Container mimics an iOS segmented control: subtle track, single pill on
 *   top; low visual weight so it sits under toolbars without shouting.
 */
import * as React from "react";
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
  const heights = size === "sm" ? "h-8 text-xs" : "h-9 text-sm";
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const count = Math.max(1, options.length);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex rounded-full border border-border bg-muted/40 p-1 shadow-soft-1",
        className
      )}
    >
      {/* Sliding indicator */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-background shadow-soft-2 ring-1 ring-border"
        style={{
          width: `calc((100% - 0.5rem) / ${count})`,
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform var(--duration-fast) var(--ease-ios)",
        }}
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 font-medium transition-colors duration-200 ease-ios",
              heights,
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
