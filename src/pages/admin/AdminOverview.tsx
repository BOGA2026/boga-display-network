import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Monitor, MapPin, FileImage, Inbox, CreditCard, TrendingUp, BadgeCheck, RefreshCw } from "lucide-react";
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

type Business = {
  id: string;
  name: string;
  created_at: string;
  screenCount: number;
  memberCount: number;
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

async function loadOverview(): Promise<{ stats: Stats; businesses: Business[] }> {
  return fetchWithRetry(
    async () => {
      const { data, error } = await supabase.functions.invoke("admin-overview");
      if (error) throw Object.assign(new Error(error.message), { status: (error as any).status ?? 500 });
      return data as { stats: Stats; businesses: Business[] };
    },
    { label: "admin-overview", timeoutMs: 12000, retries: 2 }
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadOverview();
      setStats(data?.stats ?? null);
      setBusinesses(data?.businesses ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el resumen.");
      setStats(null);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const s = stats;
  const kpis: Array<{ label: string; value: any; hint?: string; icon: any; tone: any }> = [
    { label: "Negocios", value: s?.businesses ?? 0, icon: Building2, tone: "accent" },
    { label: "Pantallas online", value: `${s?.screensOnline ?? 0} / ${s?.screens ?? 0}`, hint: "Conectadas / totales", icon: Monitor, tone: "success" },
    { label: "Ubicaciones", value: s?.locations ?? 0, icon: MapPin, tone: "neutral" },
    { label: "Contenido", value: s?.content ?? 0, icon: FileImage, tone: "neutral" },
    { label: "Leads", value: s?.leads ?? 0, hint: `${s?.leadsNew ?? 0} nuevos`, icon: Inbox, tone: "warning" },
    { label: "Suscripciones activas", value: s?.activeSubscriptions ?? 0, icon: BadgeCheck, tone: "success" },
    { label: "Ingresos del mes", value: fmtCOP(s?.revenueMonth ?? 0), hint: "Pagos aprobados este mes (Wompi)", icon: TrendingUp, tone: "accent" },
    { label: "Ingresos totales", value: fmtCOP(s?.revenueTotal ?? 0), hint: `${s?.paymentsCount ?? 0} pagos`, icon: CreditCard, tone: "success" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <AdminPageHeader
        title="Resumen"
        subtitle="Vista global de la plataforma Visualia"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  className="text-[11px] uppercase tracking-wider admin-dim"
                  style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
                >
                  <th className="text-left px-4 py-3 font-medium">Nombre</th>
                  <th className="text-right px-4 py-3 font-medium">Pantallas</th>
                  <th className="text-right px-4 py-3 font-medium">Miembros</th>
                  <th className="text-left px-4 py-3 font-medium">Registrado</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr
                    key={b.id}
                    className="admin-card-hover transition-colors"
                    style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}
                  >
                    <td className="px-4 py-3.5 font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
                      {b.name}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{b.screenCount}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{b.memberCount}</td>
                    <td className="px-4 py-3.5 admin-muted tabular-nums">
                      {new Date(b.created_at).toLocaleDateString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
