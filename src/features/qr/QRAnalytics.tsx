import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, startOfHour, startOfDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { Smartphone, Tablet, Monitor, MapPin, Radio, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQRScans } from "./useQRScans";
import type { QRScan } from "./api";

type Range = "24h" | "7d" | "30d";

const RANGE_META: Record<Range, { hours?: number; days?: number; buckets: number; step: "hour" | "day"; label: string }> = {
  "24h": { hours: 24, buckets: 24, step: "hour", label: "Últimas 24 h" },
  "7d": { days: 7, buckets: 7, step: "day", label: "Últimos 7 días" },
  "30d": { days: 30, buckets: 30, step: "day", label: "Últimos 30 días" },
};

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor, unknown: Radio } as const;
const DEVICE_LABEL: Record<string, string> = { mobile: "Móvil", tablet: "Tablet", desktop: "Escritorio", unknown: "Otro" };

interface Props {
  qrId: string | null;
  qrLabel?: string;
}

/**
 * Live analytics for a QR: total scans, hourly/daily chart, device split,
 * top locations. Everything animates in and refreshes over Supabase realtime.
 */
export function QRAnalytics({ qrId, qrLabel }: Props) {
  const [range, setRange] = useState<Range>("7d");
  const meta = RANGE_META[range];
  const sinceDays = meta.days ?? 1;
  const { scans, loading, liveCount } = useQRScans(qrId, sinceDays);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    if (meta.hours) cutoff.setHours(cutoff.getHours() - meta.hours);
    else cutoff.setDate(cutoff.getDate() - (meta.days ?? 0));
    return scans.filter((s) => new Date(s.scanned_at) >= cutoff);
  }, [scans, meta.hours, meta.days]);

  const series = useMemo(() => buildSeries(filtered, meta), [filtered, meta]);
  const deviceBreakdown = useMemo(() => breakdown(filtered, (s) => s.device_type ?? "unknown"), [filtered]);
  const locationBreakdown = useMemo(
    () => breakdown(filtered, (s) => (s.city ? `${s.city}, ${s.country ?? ""}` : s.country ?? "Desconocido")).slice(0, 6),
    [filtered],
  );

  const total = filtered.length;
  const isEmpty = !loading && total === 0;

  return (
    <div className="space-y-6">
      {/* Header — total + realtime hint + range picker */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Escaneos {qrLabel ? `de "${qrLabel}"` : ""}</p>
          <div className="flex items-baseline gap-3">
            <motion.p
              key={total}
              initial={{ scale: 1.15, color: "hsl(var(--primary))" }}
              animate={{ scale: 1, color: "hsl(var(--foreground))" }}
              transition={{ duration: 0.4 }}
              className="text-4xl font-bold tabular-nums"
            >
              {total.toLocaleString("es-CO")}
            </motion.p>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                +{liveCount} en vivo
              </span>
            )}
          </div>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="24h">24 h</TabsTrigger>
            <TabsTrigger value="7d">7 días</TabsTrigger>
            <TabsTrigger value="30d">30 días</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Timeline chart */}
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <EmptyState key="empty" range={range} />
        ) : (
          <motion.div
            key={`chart-${range}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="rounded-2xl border border-border/60 bg-card/60 p-4"
          >
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{meta.label}</h3>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qrScanFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Area type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#qrScanFill)" isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breakdowns */}
      {!isEmpty && (
        <div className="grid gap-4 md:grid-cols-2">
          <BreakdownCard title="Por dispositivo" icon={<ScanLine className="h-4 w-4" />}>
            {deviceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
            ) : (
              <ul className="space-y-2">
                {deviceBreakdown.map((row, i) => {
                  const key = row.key as keyof typeof DEVICE_ICON;
                  const Icon = DEVICE_ICON[key] ?? Radio;
                  const pct = Math.round((row.count / total) * 100);
                  return (
                    <motion.li
                      key={row.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between text-sm">
                          <span>{DEVICE_LABEL[row.key] ?? row.key}</span>
                          <span className="tabular-nums text-muted-foreground">{row.count} · {pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </BreakdownCard>

          <BreakdownCard title="Por ubicación" icon={<MapPin className="h-4 w-4" />}>
            {locationBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ubicaciones detectadas todavía.</p>
            ) : (
              <div className="h-40">
                <ResponsiveContainer>
                  <BarChart data={locationBreakdown} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="key" width={130} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </BreakdownCard>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- helpers ------------------------------- */

function buildSeries(scans: QRScan[], meta: (typeof RANGE_META)[Range]) {
  const now = new Date();
  const buckets: { at: Date; label: string; scans: number }[] = [];
  if (meta.step === "hour") {
    for (let i = meta.buckets - 1; i >= 0; i--) {
      const at = startOfHour(new Date(now.getTime() - i * 3600_000));
      buckets.push({ at, label: format(at, "HH:mm"), scans: 0 });
    }
    for (const s of scans) {
      const at = startOfHour(new Date(s.scanned_at));
      const b = buckets.find((x) => x.at.getTime() === at.getTime());
      if (b) b.scans++;
    }
  } else {
    for (let i = meta.buckets - 1; i >= 0; i--) {
      const at = startOfDay(subDays(now, i));
      buckets.push({ at, label: format(at, "d MMM", { locale: es }), scans: 0 });
    }
    for (const s of scans) {
      const at = startOfDay(new Date(s.scanned_at));
      const b = buckets.find((x) => isSameDay(x.at, at));
      if (b) b.scans++;
    }
  }
  return buckets;
}

function breakdown<T extends string>(scans: QRScan[], keyOf: (s: QRScan) => T) {
  const map = new Map<string, number>();
  for (const s of scans) {
    const k = keyOf(s) || "unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

function BreakdownCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-border/60 bg-card/60 p-4"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon} {title}
      </div>
      {children}
    </motion.div>
  );
}

function EmptyState({ range }: { range: Range }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60",
        "bg-gradient-to-br from-primary/5 via-transparent to-transparent p-10 text-center",
      )}
    >
      <div className="relative">
        <ScanLine className="h-12 w-12 text-primary/70" />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      </div>
      <div>
        <p className="text-base font-medium">Todavía no hay escaneos en {RANGE_META[range].label.toLowerCase()}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Imprimí el QR o mostralo en pantalla. El primer escaneo aparece acá en cuestión de segundos.
        </p>
      </div>
    </motion.div>
  );
}
