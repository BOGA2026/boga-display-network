import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Inbox,
  TrendingUp,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  MonitorOff,
  CreditCard,
  MapPin,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useAdminBusinessStats, statusMeta, TONE_STYLE } from "@/hooks/useAdminBusinessStats";
import { useAdminAttention } from "@/hooks/useAdminAttention";

import { AdminKpiCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { fetchWithRetry } from "@/lib/adminFetch";

type Stats = {
  businesses: number;
  screens: number;
  screensOnline: number;
  locations: number;
  content: number;
  leads: number;
  leadsNew: number;
  activeSubscriptions: number;
  revenueTotal: number;
  revenueMonth: number;
  paymentsCount: number;
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

async function loadOverview(): Promise<{ stats: Stats }> {
  return fetchWithRetry(
    async () => {
      const { data, error } = await supabase.functions.invoke("admin-overview");
      if (error) throw Object.assign(new Error(error.message), { status: (error as any).status ?? 500 });
      return data as { stats: Stats };
    },
    { label: "admin-overview", timeoutMs: 12000, retries: 2 }
  );
}

type Alert = {
  key: string;
  text: string;
  to: string;
  cta: string;
  tone: "danger" | "warn";
  icon: typeof AlertTriangle;
};

function AlertRow({ a }: { a: Alert }) {
  const color = a.tone === "danger" ? "hsl(var(--admin-danger))" : "hsl(var(--admin-warning))";
  return (
    <Link
      to={a.to}
      className="flex items-center justify-between gap-4 px-4 py-3 admin-card-hover transition-colors"
      style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}
    >
      <span className="flex items-center gap-3 min-w-0">
        <a.icon className="h-4 w-4 shrink-0" style={{ color }} />
        <span className="text-[13px] truncate" style={{ color: "hsl(var(--admin-fg))" }}>
          {a.text}
        </span>
      </span>
      <span className="flex items-center gap-1 text-[12px] font-medium shrink-0" style={{ color }}>
        {a.cta}
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { rows: businesses, totals, refetch: refetchStats } = useAdminBusinessStats();
  const {
    offlineScreens,
    pendingLeads,
    leadsThisWeek,
    businessesMissingCoords,
    refetch: refetchAttention,
  } = useAdminAttention();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    refetchStats();
    refetchAttention();
    try {
      const data = await loadOverview();
      setStats(data?.stats ?? null);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el resumen.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [refetchStats, refetchAttention]);

  useEffect(() => {
    load();
  }, [load]);

  const s = stats;
  const activeBusinesses = businesses.filter((b) => b.screens_online > 0).length;
  const overdue = businesses.filter((b) => b.status === "past_due");

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];
    if (offlineScreens.length > 0) {
      list.push({
        key: "screens",
        text:
          offlineScreens.length === 1
            ? "1 pantalla lleva más de 48 h sin reportar"
            : `${offlineScreens.length} pantallas llevan más de 48 h sin reportar`,
        to: "/master/pantallas",
        cta: "Ver pantallas",
        tone: "danger",
        icon: MonitorOff,
      });
    }
    if (pendingLeads.length > 0) {
      list.push({
        key: "leads",
        text: pendingLeads.length === 1 ? "1 lead sin contactar" : `${pendingLeads.length} leads sin contactar`,
        to: "/master/leads",
        cta: "Ver leads",
        tone: "warn",
        icon: Inbox,
      });
    }
    for (const b of overdue) {
      list.push({
        key: `sub-${b.business_id}`,
        text:
          b.days_overdue > 0
            ? `${b.business_name}: suscripción vencida hace ${b.days_overdue} días`
            : `${b.business_name}: suscripción vencida`,
        to: "/master/suscripciones",
        cta: "Ver suscripción",
        tone: "danger",
        icon: CreditCard,
      });
    }
    if (businessesMissingCoords.length > 0) {
      list.push({
        key: "coords",
        text:
          businessesMissingCoords.length === 1
            ? `1 negocio sin coordenadas en el mapa (${businessesMissingCoords[0].name})`
            : `${businessesMissingCoords.length} negocios sin coordenadas en el mapa`,
        to: "/master/mapa",
        cta: "Completar",
        tone: "warn",
        icon: MapPin,
      });
    }
    return list;
  }, [offlineScreens.length, pendingLeads.length, overdue, businessesMissingCoords]);

  const kpis: Array<{ label: string; value: any; hint?: any; icon: any; tone: any }> = [
    {
      label: "Negocios activos",
      value: `${activeBusinesses} / ${totals.businesses}`,
      hint: "Con al menos una pantalla en línea",
      icon: Building2,
      tone: activeBusinesses === 0 ? "danger" : "success",
    },
    {
      label: "Cobrado este mes",
      value: fmtCOP(s?.revenueMonth ?? 0),
      hint: `Acumulado histórico ${fmtCOP(s?.revenueTotal ?? 0)} · ${s?.paymentsCount ?? 0} pagos`,
      icon: TrendingUp,
      tone: (s?.revenueMonth ?? 0) > 0 ? "success" : "neutral",
    },
    {
      label: "MRR proyectado",
      value: <span className="admin-muted">{fmtCOP(totals.mrr)}</span>,
      hint: "Proyección: precio por pantalla × pantallas reales. No es plata cobrada.",
      icon: DollarSign,
      tone: "neutral",
    },
    {
      label: "Leads nuevos esta semana",
      value: leadsThisWeek,
      hint: `${pendingLeads.length} sin contactar en total`,
      icon: Inbox,
      tone: pendingLeads.length > 0 ? "warning" : "neutral",
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <AdminPageHeader
        title="Resumen"
        subtitle="Qué necesita atención hoy"
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
            style={{
              border: "1px solid hsl(var(--admin-border))",
              background: "hsl(var(--admin-surface))",
              color: "hsl(var(--admin-fg))",
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        }
      />

      {error && (
        <div
          className="admin-card p-4 flex items-start justify-between gap-4"
          style={{ borderColor: "hsl(var(--admin-danger) / 0.4)" }}
        >
          <div>
            <p className="text-[13px] font-medium" style={{ color: "hsl(var(--admin-danger))" }}>
              No pudimos cargar el resumen
            </p>
            <p className="text-[12px] admin-muted mt-1">{error}</p>
          </div>
          <button
            onClick={load}
            className="text-[12px] font-medium rounded-md px-3 py-1.5"
            style={{
              border: "1px solid hsl(var(--admin-border))",
              background: "hsl(var(--admin-surface))",
              color: "hsl(var(--admin-fg))",
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Franja de alertas: solo aparece cuando hay algo que atender */}
      {alerts.length > 0 && (
        <div className="admin-card overflow-hidden" style={{ borderColor: "hsl(var(--admin-danger) / 0.35)" }}>
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{ borderBottom: "1px solid hsl(var(--admin-border))", background: "hsl(var(--admin-danger) / 0.06)" }}
          >
            <AlertTriangle className="h-4 w-4" style={{ color: "hsl(var(--admin-danger))" }} />
            <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
              Requiere tu atención
            </span>
            <span className="text-[12px] admin-muted">({alerts.length})</span>
          </div>
          {alerts.map((a) => (
            <AlertRow key={a.key} a={a} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <AdminKpiCard key={k.label} {...k} loading={loading && !error} />
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div
          className="p-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
        >
          <h2 className="text-[14px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
            Negocios recientes
          </h2>
          <span className="text-[12px] admin-muted">{businesses.length}</span>
        </div>

        {loading && businesses.length === 0 && !error ? (
          <div className="p-6 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded animate-pulse"
                style={{ background: "hsl(var(--admin-surface-2))" }}
              />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
            <Building2 className="h-6 w-6 admin-dim" />
            <p className="text-[13px] font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
              Sin negocios todavía
            </p>
            <p className="text-[12px] admin-muted max-w-sm">
              Cuando alguien complete el registro aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-xs uppercase tracking-wider admin-dim"
                  style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
                >
                  <th className="text-left px-4 py-3 font-medium">Nombre</th>
                  <th className="text-right px-4 py-3 font-medium">Pantallas</th>
                  <th className="text-right px-4 py-3 font-medium">Miembros</th>
                  <th className="text-left px-4 py-3 font-medium">Suscripción</th>
                  <th className="text-left px-4 py-3 font-medium">Registrado</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr
                    key={b.business_id}
                    className="admin-card-hover transition-colors"
                    style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}
                  >
                    <td className="px-4 py-3.5 font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
                      {b.business_name}
                    </td>
                    <td className="px-4 py-3.5 text-right v-numeric">{b.screens_total}</td>
                    <td className="px-4 py-3.5 text-right v-numeric">{b.members_total}</td>
                    <td className="px-4 py-3.5">
                      {b.subscription_id ? (
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            background: TONE_STYLE[statusMeta(b.status).tone].bg,
                            color: TONE_STYLE[statusMeta(b.status).tone].fg,
                          }}
                        >
                          {statusMeta(b.status).label}
                        </span>
                      ) : (
                        <span className="admin-dim text-xs">Sin suscripción</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 admin-muted v-numeric">
                      {new Date(b.created_at).toLocaleDateString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lo accionable, en vez de espacio en blanco */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="admin-card overflow-hidden">
          <div
            className="p-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
          >
            <h2 className="text-[14px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
              Leads sin gestionar
            </h2>
            <Link to="/master/leads" className="text-[12px] font-medium" style={{ color: "hsl(var(--admin-accent))" }}>
              Ver todos
            </Link>
          </div>
          {pendingLeads.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(var(--admin-success))" }} />
              <p className="text-[13px] admin-muted">Todos los leads están gestionados.</p>
            </div>
          ) : (
            <ul>
              {pendingLeads.slice(0, 6).map((l) => (
                <li
                  key={l.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                  style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "hsl(var(--admin-fg))" }}>
                      {l.name || "Sin nombre"}
                    </p>
                    <p className="text-[12px] admin-muted truncate">
                      {[l.company, l.city, l.whatsapp || l.phone].filter(Boolean).join(" · ") || "Sin datos"}
                    </p>
                  </div>
                  <span className="text-[11px] admin-dim v-numeric shrink-0">
                    {l.created_at ? new Date(l.created_at).toLocaleDateString("es-CO") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-card overflow-hidden">
          <div
            className="p-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
          >
            <h2 className="text-[14px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
              Pantallas caídas
            </h2>
            <Link
              to="/master/pantallas"
              className="text-[12px] font-medium"
              style={{ color: "hsl(var(--admin-accent))" }}
            >
              Ver todas
            </Link>
          </div>
          {offlineScreens.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(var(--admin-success))" }} />
              <p className="text-[13px] admin-muted">Todas las pantallas reportaron en las últimas 48 h.</p>
            </div>
          ) : (
            <ul>
              {offlineScreens.slice(0, 6).map((sc) => (
                <li
                  key={sc.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                  style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "hsl(var(--admin-fg))" }}>
                      {sc.name}
                    </p>
                    <p className="text-[12px] admin-muted truncate">
                      {sc.business_name} · {sc.location_name}
                    </p>
                  </div>
                  <span className="text-[11px] shrink-0 v-numeric" style={{ color: "hsl(var(--admin-danger))" }}>
                    {sc.hours_offline == null
                      ? "Nunca reportó"
                      : sc.hours_offline >= 48
                        ? `Hace ${Math.floor(sc.hours_offline / 24)} días`
                        : `Hace ${sc.hours_offline} h`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
