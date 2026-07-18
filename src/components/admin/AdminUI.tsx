import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const toneColor: Record<Tone, string> = {
  neutral: "hsl(var(--admin-fg-muted))",
  success: "hsl(var(--admin-success))",
  warning: "hsl(var(--admin-warning))",
  danger: "hsl(var(--admin-danger))",
  accent: "hsl(var(--admin-accent))",
};

export function AdminKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  loading = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  loading?: boolean;
}) {
  return (
    <div className="admin-card p-5 flex flex-col gap-3 min-h-[112px]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12px] font-medium admin-muted leading-tight">{label}</span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-md shrink-0"
          style={{
            background: `${toneColor[tone].replace("hsl(", "hsla(").replace(")", " / 0.12)")}`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: toneColor[tone] }} strokeWidth={2} />
        </span>
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-24 rounded animate-pulse" style={{ background: "hsl(var(--admin-surface-2))" }} />
        ) : (
          <div
            className="text-[26px] font-semibold leading-none tracking-tight"
            style={{ color: "hsl(var(--admin-fg))" }}
          >
            {value}
          </div>
        )}
        {hint && !loading && (
          <div className="text-[11px] admin-dim mt-1.5">{hint}</div>
        )}
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1
          className="text-[22px] font-semibold tracking-tight"
          style={{ color: "hsl(var(--admin-fg))" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] admin-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
