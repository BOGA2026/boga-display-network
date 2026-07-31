/**
 * Fila superior del panel: estado de la red (2/3) + uptime 7 días (1/3),
 * y una tira compacta de atajos de inventario (no son KPIs).
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type NetworkScreen = { id: string; name: string; status: string | null };

const iconChip =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20";

/* ── Estado de la red ─────────────────────────────────────────── */
export function NetworkStatusCard({ screens }: { screens: NetworkScreen[] }) {
  const total = screens.length;
  const online = screens.filter((s) => s.status === "online").length;
  const hasDown = total > 0 && online < total;
  const pct = total ? (online / total) * 100 : 0;

  return (
    <Card
      className={cn(
        "surface-elevated h-full transition-colors",
        hasDown ? "border-destructive/50" : "border-border/30",
      )}
    >
      <CardContent className="v-kpi-card h-full justify-between">
        <div>
          <p className="v-kpi-label">Estado de la red</p>
          <p className="v-numeric mt-1 text-[36px] font-semibold leading-none text-foreground">
            {online} de {total}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">pantallas en línea</p>
        </div>

        {total === 0 ? (
          <div className="h-2.5 w-full rounded-full bg-muted" />
        ) : total <= 20 ? (
          <div className="flex gap-1" role="img" aria-label={`${online} de ${total} pantallas en línea`}>
            {screens.map((s) => (
              <span
                key={s.id}
                title={`${s.name}: ${s.status === "online" ? "En línea" : "Fuera de línea"}`}
                className={cn(
                  "h-2.5 flex-1 rounded-full",
                  s.status === "online" ? "bg-primary" : "bg-destructive/70",
                )}
              />
            ))}
          </div>
        ) : (
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-destructive/30">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Uptime 7 días ────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

export function useUptime7d(businessId?: string) {
  return useQuery({
    queryKey: ["dashboard", "uptime-7d", businessId],
    enabled: Boolean(businessId),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<number[]> => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const to = new Date();
        to.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - (6 - i) + 1);
        const from = new Date(to);
        from.setDate(from.getDate() - 1);
        return { from, to };
      });
      const results = await Promise.all(
        days.map(async ({ from, to }) => {
          const { data, error } = await rpc("analytics_overview", {
            p_business_id: businessId,
            p_from: from.toISOString(),
            p_to: to.toISOString(),
          });
          if (error) return 0;
          return Number(data?.[0]?.uptime_pct ?? 0);
        }),
      );
      return results;
    },
  });
}

function Sparkline({ values }: { values: number[] }) {
  const w = 100;
  const h = 28;
  const max = 100;
  const points = values.map((v, i) => {
    const x = values.length > 1 ? (i / (values.length - 1)) * w : w / 2;
    const y = h - (Math.min(Math.max(v, 0), max) / max) * (h - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function UptimeCard({ businessId }: { businessId?: string }) {
  const { data, isLoading } = useUptime7d(businessId);
  const series = data ?? [];
  const avg = series.length ? series.reduce((a, b) => a + b, 0) / series.length : 0;

  return (
    <Card className="surface-elevated h-full border-border/30">
      <CardContent className="v-kpi-card h-full justify-between">
        <div>
          <p className="v-kpi-label">Uptime 7 días</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className="v-numeric mt-1 text-3xl font-semibold leading-none text-foreground">
              {avg.toFixed(1)}%
            </p>
          )}
        </div>
        {isLoading ? <Skeleton className="h-7 w-full" /> : <Sparkline values={series.length ? series : [0, 0]} />}
      </CardContent>
    </Card>
  );
}

/* ── Atajos de inventario ─────────────────────────────────────── */
export interface InventoryChip {
  icon: LucideIcon;
  count: number;
  label: string;
  path: string;
}

export function InventoryStrip({ items }: { items: InventoryChip[] }) {
  return (
    <div className="v-grid sm:grid-cols-3">
      {items.map((it) => (
        <Link
          key={it.path}
          to={it.path}
          className="v-focus-ring flex h-11 items-center gap-2 rounded-xl border border-border/40 bg-card px-3 text-sm transition-colors hover:border-primary/40 hover:bg-secondary/60"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <it.icon className="h-3.5 w-3.5" />
          </span>
          <span className="v-numeric font-semibold text-foreground">{it.count}</span>
          <span className="truncate text-muted-foreground">{it.label}</span>
        </Link>
      ))}
    </div>
  );
}

export { iconChip };
