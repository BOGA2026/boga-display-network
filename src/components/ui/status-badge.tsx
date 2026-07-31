/**
 * StatusBadge — single primitive for state chips.
 *
 * Rationale:
 * - `live` uses the reserved green accent + pulsing ring so real-time state
 *   pops without competing with the violet brand.
 * - Non-live variants are quiet (muted surface, no motion) so a wall of
 *   screens doesn't feel like a discotheque.
 * - Size stays label-height (18-22px) to sit inline with text.
 */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const dotVariants = cva("v-dot", {
  variants: {
    variant: {
      live: "v-dot-live",
      online: "v-dot-online",
      offline: "v-dot-offline",
      idle: "v-dot-idle",
      warning: "v-dot-warning",
    },
    size: {
      sm: "v-dot-sm",
      md: "",
    },
  },
  defaultVariants: { variant: "offline", size: "md" },
});

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        live: "border-live/30 bg-live/10 text-live",
        online: "border-live/30 bg-live/5 text-live",
        offline: "border-border bg-muted/40 text-muted-foreground",
        idle: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
        warning: "border-orange-500/30 bg-orange-500/10 text-orange-300",
      },
    },
    defaultVariants: { variant: "offline" },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  label?: string;
  dotOnly?: boolean;
  size?: "sm" | "md";
}

export function StatusBadge({
  variant = "offline",
  label,
  dotOnly,
  size = "md",
  className,
  ...rest
}: StatusBadgeProps) {
  if (dotOnly) {
    return (
      <span
        aria-label={label}
        className={cn(dotVariants({ variant, size }), className)}
        {...rest}
      />
    );
  }
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...rest}>
      <span className={dotVariants({ variant, size: "sm" })} />
      {label ?? variant}
    </span>
  );
}
