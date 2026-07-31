import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OverviewRow {
  screens_total: number;
  screens_online: number;
  uptime_pct: number;
  playbacks: number;
  total_play_ms: number;
}

/**
 * Los medios viven en `content` (no en `content_items`, que son renglones de
 * menú), por eso la clave es `content_id`. `duration_seconds` viene de
 * `content` y permite calcular tiempo en pantalla sin depender de duration_ms.
 */
export interface TopContentRow {
  content_id: string;
  name: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  playbacks: number;
  total_ms: number;
}

export interface ScreenTableRow {
  screen_id: string;
  name: string;
  location: string;
  uptime_pct: number;
  playbacks: number;
  last_seen_at: string | null;
  status: string;
}

type Range = { from: Date | string; to: Date | string };

const iso = (v: Date | string) => (typeof v === "string" ? v : v.toISOString());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

export function useAnalyticsOverview(businessId?: string, range?: Range) {
  return useQuery({
    queryKey: ["analytics", "overview", businessId, range && iso(range.from), range && iso(range.to)],
    enabled: Boolean(businessId && range),
    queryFn: async (): Promise<OverviewRow | null> => {
      const { data, error } = await rpc("analytics_overview", {
        p_business_id: businessId,
        p_from: iso(range!.from),
        p_to: iso(range!.to),
      });
      if (error) throw error;
      return (data as OverviewRow[])?.[0] ?? null;
    },
  });
}

export function useTopContent(businessId?: string, range?: Range, limit = 10) {
  return useQuery({
    queryKey: ["analytics", "top-content", businessId, range && iso(range.from), range && iso(range.to), limit],
    enabled: Boolean(businessId && range),
    queryFn: async (): Promise<TopContentRow[]> => {
      const { data, error } = await rpc("analytics_top_content", {
        p_business_id: businessId,
        p_from: iso(range!.from),
        p_to: iso(range!.to),
        p_limit: limit,
      });
      if (error) throw error;
      return (data as TopContentRow[]) ?? [];
    },
  });
}

export function useScreenTable(businessId?: string, range?: Range) {
  return useQuery({
    queryKey: ["analytics", "screens", businessId, range && iso(range.from), range && iso(range.to)],
    enabled: Boolean(businessId && range),
    queryFn: async (): Promise<ScreenTableRow[]> => {
      const { data, error } = await rpc("analytics_screen_table", {
        p_business_id: businessId,
        p_from: iso(range!.from),
        p_to: iso(range!.to),
      });
      if (error) throw error;
      return (data as ScreenTableRow[]) ?? [];
    },
  });
}

/* ── Severidad de última sincronización ───────────────────────────────
 * Una pantalla que lleva horas (o meses) sin reportar es un problema y
 * debe verse como tal en toda la app. Fuente única de verdad.
 */
export type SyncSeverity = "ok" | "warn" | "critical" | "never";

export interface SyncSeverityInfo {
  severity: SyncSeverity;
  /** Clase de color de texto para el label. */
  className: string;
  /** Si debe mostrarse icono de advertencia + tooltip. */
  warn: boolean;
  hoursSince: number | null;
  /** Texto relativo listo para pintar. */
  label: string;
}

export function syncSeverity(
  lastSeenAt: string | Date | null | undefined,
  now: number = Date.now(),
): SyncSeverityInfo {
  if (!lastSeenAt) {
    return { severity: "never", className: "text-rose-400", warn: true, hoursSince: null, label: "Nunca" };
  }
  const ts = lastSeenAt instanceof Date ? lastSeenAt.getTime() : new Date(lastSeenAt).getTime();
  if (Number.isNaN(ts)) {
    return { severity: "never", className: "text-rose-400", warn: true, hoursSince: null, label: "Nunca" };
  }
  const hours = Math.max(0, (now - ts) / 3_600_000);
  const label = formatSyncAgo(hours);
  if (hours < 2) return { severity: "ok", className: "text-muted-foreground", warn: false, hoursSince: hours, label };
  if (hours <= 48) return { severity: "warn", className: "text-amber-400", warn: true, hoursSince: hours, label };
  return { severity: "critical", className: "text-rose-400", warn: true, hoursSince: hours, label };
}

function formatSyncAgo(hours: number): string {
  const minutes = hours * 60;
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${Math.round(minutes)} min`;
  if (hours < 24) return `Hace ${Math.round(hours)} h`;
  return `Hace ${Math.round(hours / 24)} d`;
}

/* ── Métricas derivadas ──────────────────────────────────────────────── */

export interface AirtimeRow {
  /** Minutos realmente al aire en el periodo. */
  minutes_online: number;
  /** Minutos programados reales (desde la programación, nunca 1440 fijo). */
  minutes_expected: number;
  scans: number;
  /** null cuando no hubo horas al aire: nunca se divide por cero. */
  scans_per_hour: number | null;
}

export interface OrphanContentRow {
  content_id: string;
  name: string;
  thumbnail_url: string | null;
  created_at: string;
}

/** Horas al aire vs. programadas + escaneos por hora al aire. */
export function useAirtime(businessId?: string, range?: Range) {
  return useQuery({
    queryKey: ["analytics", "airtime", businessId, range && iso(range.from), range && iso(range.to)],
    enabled: Boolean(businessId && range),
    queryFn: async (): Promise<AirtimeRow | null> => {
      const { data, error } = await rpc("analytics_airtime", {
        p_business_id: businessId,
        p_from: iso(range!.from),
        p_to: iso(range!.to),
      });
      if (error) throw error;
      const row = (data as AirtimeRow[])?.[0] ?? null;
      if (!row) return null;
      return {
        minutes_online: Number(row.minutes_online ?? 0),
        minutes_expected: Number(row.minutes_expected ?? 0),
        scans: Number(row.scans ?? 0),
        scans_per_hour: row.scans_per_hour === null ? null : Number(row.scans_per_hour),
      };
    },
  });
}

/** Piezas de `content` sin ninguna reproducción en el periodo. */
export function useOrphanContent(businessId?: string, range?: Range) {
  return useQuery({
    queryKey: ["analytics", "orphan", businessId, range && iso(range.from), range && iso(range.to)],
    enabled: Boolean(businessId && range),
    queryFn: async (): Promise<OrphanContentRow[]> => {
      const { data, error } = await rpc("analytics_orphan_content", {
        p_business_id: businessId,
        p_from: iso(range!.from),
        p_to: iso(range!.to),
      });
      if (error) throw error;
      return (data as OrphanContentRow[]) ?? [];
    },
  });
}

/**
 * Días con telemetría registrada. Antes de 7 días todo el contenido parecería
 * huérfano, así que la tarjeta de desperdicio no debe mostrarse.
 */
export function useTelemetryDays(businessId?: string) {
  return useQuery({
    queryKey: ["analytics", "telemetry-days", businessId],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<number> => {
      const { data, error } = await rpc("analytics_telemetry_days", { p_business_id: businessId });
      if (error) throw error;
      return Number(data ?? 0);
    },
  });
}

/* ── Formato ─────────────────────────────────────────────────────────── */

const nf1 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

/** "11,2 h" — coma decimal colombiana, sin decimales inútiles. */
export function formatHoras(minutes: number): string {
  return `${nf1.format(Math.round((minutes / 60) * 10) / 10)} h`;
}

/** "3,4 escaneos/h" o "—" cuando no hay horas al aire. */
export function formatEscaneosHora(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${nf1.format(value)} escaneos/h`;
}
