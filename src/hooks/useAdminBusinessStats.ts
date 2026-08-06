import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fuente única de números del panel master.
 * Todos los módulos (Resumen, Negocios, Pantallas, Soporte, Suscripciones,
 * Vencimientos) leen de aquí. Ninguno cuenta por su cuenta.
 */
export type AdminBusinessStat = {
  business_id: string;
  business_name: string;
  created_at: string;
  screens_total: number;
  screens_online: number;
  locations_total: number;
  content_total: number;
  members_total: number;
  subscription_id: string | null;
  plan: string | null;
  billing_cycle: string | null;
  status_stored: string | null;
  status: SubStatus | null;
  next_billing_date: string | null;
  grace_period_ends_at: string | null;
  days_overdue: number;
  price_per_screen: number | null;
  mrr: number;
};

export type SubStatus = "active" | "grace" | "past_due" | "trialing" | "canceled" | "paused";

export const SUB_STATUS_LABELS: Record<string, { label: string; tone: "ok" | "warn" | "danger" | "muted" }> = {
  active: { label: "Activa", tone: "ok" },
  grace: { label: "En periodo de gracia", tone: "warn" },
  trialing: { label: "Prueba", tone: "warn" },
  past_due: { label: "Vencida", tone: "danger" },
  canceled: { label: "Cancelada", tone: "muted" },
  paused: { label: "Pausada", tone: "muted" },
};

export const TONE_STYLE: Record<string, { bg: string; fg: string }> = {
  ok: { bg: "hsl(var(--admin-success) / 0.15)", fg: "hsl(var(--admin-success))" },
  warn: { bg: "hsl(var(--admin-warning) / 0.15)", fg: "hsl(var(--admin-warning))" },
  danger: { bg: "hsl(var(--admin-danger) / 0.15)", fg: "hsl(var(--admin-danger))" },
  muted: { bg: "hsl(var(--admin-surface-2))", fg: "hsl(var(--admin-fg-muted))" },
};

export const statusMeta = (status?: string | null) =>
  SUB_STATUS_LABELS[status ?? ""] ?? { label: status ?? "Sin suscripción", tone: "muted" as const };

export const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

async function fetchAdminBusinessStats(): Promise<AdminBusinessStat[]> {
  const { data, error } = await (supabase as any).rpc("admin_business_stats");
  if (error) throw new Error(error.message);
  return ((data as any[]) ?? []).map((r) => ({
    ...r,
    screens_total: Number(r.screens_total ?? 0),
    screens_online: Number(r.screens_online ?? 0),
    locations_total: Number(r.locations_total ?? 0),
    content_total: Number(r.content_total ?? 0),
    members_total: Number(r.members_total ?? 0),
    days_overdue: Number(r.days_overdue ?? 0),
    price_per_screen: r.price_per_screen == null ? null : Number(r.price_per_screen),
    mrr: Number(r.mrr ?? 0),
  })) as AdminBusinessStat[];
}

export function useAdminBusinessStats() {
  const query = useQuery({
    queryKey: ["admin", "business-stats"],
    queryFn: fetchAdminBusinessStats,
    staleTime: 30_000,
  });

  const rows = query.data ?? [];
  const totals = {
    businesses: rows.length,
    screens: rows.reduce((a, r) => a + r.screens_total, 0),
    screensOnline: rows.reduce((a, r) => a + r.screens_online, 0),
    locations: rows.reduce((a, r) => a + r.locations_total, 0),
    content: rows.reduce((a, r) => a + r.content_total, 0),
    members: rows.reduce((a, r) => a + r.members_total, 0),
    activeSubscriptions: rows.filter((r) => r.status === "active" || r.status === "grace").length,
    pastDue: rows.filter((r) => r.status === "past_due").length,
    // MRR = precio por pantalla x pantallas reales, solo de suscripciones vigentes.
    mrr: rows.reduce((a, r) => a + r.mrr, 0),
  };

  const byBusiness = new Map(rows.map((r) => [r.business_id, r]));

  return { ...query, rows, totals, byBusiness };
}
