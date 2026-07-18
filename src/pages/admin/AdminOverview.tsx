import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Monitor, MapPin, FileImage, Inbox, CreditCard, TrendingUp, Wifi } from "lucide-react";
import { AdminKpiCard, AdminPageHeader } from "@/components/admin/AdminUI";

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

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke("admin-overview");
      if (error) setError(error.message);
      else {
        setStats(data.stats);
        setBusinesses(data.businesses ?? []);
      }
      setLoading(false);
    })();
  }, []);

  if (error) {
    return (
      <div className="p-8 text-[13px]" style={{ color: "hsl(var(--admin-danger))" }}>
        Error: {error}
      </div>
    );
  }

  const s = stats;
  const kpis: Array<{ label: string; value: any; hint?: string; icon: any; tone: any }> = [
    { label: "Negocios", value: s?.businesses ?? 0, icon: Building2, tone: "accent" },
    { label: "Pantallas online", value: `${s?.screensOnline ?? 0} / ${s?.screens ?? 0}`, hint: "Conectadas / totales", icon: Monitor, tone: "success" },
    { label: "Ubicaciones", value: s?.locations ?? 0, icon: MapPin, tone: "neutral" },
    { label: "Contenido", value: s?.content ?? 0, icon: FileImage, tone: "neutral" },
    { label: "Leads", value: s?.leads ?? 0, hint: `${s?.leadsNew ?? 0} nuevos`, icon: Inbox, tone: "warning" },
    { label: "Suscripciones activas", value: s?.activeSubscriptions ?? 0, icon: Wifi, tone: "success" },
    { label: "Ingresos del mes", value: fmtCOP(s?.revenueMonth ?? 0), icon: TrendingUp, tone: "accent" },
    { label: "Ingresos totales", value: fmtCOP(s?.revenueTotal ?? 0), hint: `${s?.paymentsCount ?? 0} pagos`, icon: CreditCard, tone: "success" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <AdminPageHeader title="Resumen" subtitle="Vista global de la plataforma Visualia" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <AdminKpiCard key={k.label} {...k} loading={loading} />
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
              {businesses.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center admin-muted">
                    Sin negocios todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
