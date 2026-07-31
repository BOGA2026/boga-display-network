import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, CheckCircle2, XCircle, Clock, DollarSign, Search } from "lucide-react";
import { AdminKpiCard, AdminPageHeader } from "@/components/admin/AdminUI";

type Sub = {
  id: string;
  business_id: string;
  plan: string;
  status: string;
  screens_count: number;
  total_amount: number;
  billing_cycle: string;
  next_billing_date: string | null;
  created_at: string;
  businesses?: { name: string } | null;
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  active:    { label: "Activa",     bg: "hsl(var(--admin-success) / 0.15)", fg: "hsl(var(--admin-success))" },
  trial:     { label: "Prueba",     bg: "hsl(var(--admin-warning) / 0.15)", fg: "hsl(var(--admin-warning))" },
  trialing:  { label: "Prueba",     bg: "hsl(var(--admin-warning) / 0.15)", fg: "hsl(var(--admin-warning))" },
  past_due:  { label: "Vencida",    bg: "hsl(var(--admin-danger) / 0.15)",  fg: "hsl(var(--admin-danger))"  },
  canceled:  { label: "Cancelada",  bg: "hsl(var(--admin-surface-2))",       fg: "hsl(var(--admin-fg-muted))" },
  cancelled: { label: "Cancelada",  bg: "hsl(var(--admin-surface-2))",       fg: "hsl(var(--admin-fg-muted))" },
  paused:    { label: "Pausada",    bg: "hsl(var(--admin-surface-2))",       fg: "hsl(var(--admin-fg-muted))" },
};

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,business_id,plan,status,screens_count,total_amount,billing_cycle,next_billing_date,created_at,businesses(name)")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setSubs((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const kpis = useMemo(() => {
    const active = subs.filter((s) => s.status === "active");
    return {
      total: active.length,
      trial: subs.filter((s) => s.status === "trial" || s.status === "trialing").length,
      canceled: subs.filter((s) => s.status === "canceled" || s.status === "cancelled").length,
      mrr: active.reduce(
        (acc, s) => acc + Number(s.total_amount || 0) * (s.billing_cycle === "yearly" ? 1 / 12 : 1),
        0,
      ),
    };
  }, [subs]);

  const plans = useMemo(() => Array.from(new Set(subs.map((s) => s.plan).filter(Boolean))), [subs]);

  const filtered = subs.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (planFilter !== "all" && s.plan !== planFilter) return false;
    if (search && !s.businesses?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <AdminPageHeader
        title="Suscripciones"
        subtitle="Estado de suscripciones activas por negocio"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminKpiCard label="Activas" value={kpis.total} icon={CheckCircle2} tone="success" loading={loading} />
        <AdminKpiCard label="En prueba" value={kpis.trial} icon={Clock} tone="warning" loading={loading} />
        <AdminKpiCard label="Canceladas" value={kpis.canceled} icon={XCircle} tone="danger" loading={loading} />
        <AdminKpiCard label="MRR estimado" value={fmtCOP(kpis.mrr)} icon={DollarSign} tone="accent" loading={loading} hint="Suma teórica de suscripciones activas. No refleja pagos cobrados — ver Resumen › Ingresos del mes." />
      </div>

      <div className="admin-card overflow-hidden">
        <div
          className="p-4 flex items-center gap-2 flex-wrap"
          style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
        >
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 admin-dim" />
            <input
              placeholder="Buscar negocio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-md pl-9 pr-3 text-[13px]"
            />
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-9 rounded-md px-3 text-[13px]"
          >
            <option value="all">Todos los planes</option>
            {plans.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md px-3 text-[13px]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="trial">Prueba</option>
            <option value="past_due">Vencida</option>
            <option value="canceled">Cancelada</option>
          </select>
          <span className="ml-auto text-[12px] admin-muted">{filtered.length} resultados</span>
        </div>

        {error && <div className="p-4 text-[13px]" style={{ color: "hsl(var(--admin-danger))" }}>Error: {error}</div>}

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded animate-pulse" style={{ background: "hsl(var(--admin-surface-2))" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[13px] admin-muted flex flex-col items-center gap-3">
            <CreditCard className="h-8 w-8 admin-dim" strokeWidth={1.5} />
            Sin suscripciones que coincidan con los filtros
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-xs uppercase tracking-wider admin-dim"
                  style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
                >
                  <th className="text-left px-4 py-3 font-medium">Negocio</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 font-medium">Pantallas</th>
                  <th className="text-right px-4 py-3 font-medium">Monto</th>
                  <th className="text-left px-4 py-3 font-medium">Próximo cobro</th>
                  <th className="text-left px-4 py-3 font-medium">Inicio</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const st = STATUS_LABELS[s.status] ?? {
                    label: s.status,
                    bg: "hsl(var(--admin-surface-2))",
                    fg: "hsl(var(--admin-fg-muted))",
                  };
                  return (
                    <tr
                      key={s.id}
                      className="admin-card-hover transition-colors"
                      style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}
                    >
                      <td className="px-4 py-3.5 font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
                        {s.businesses?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 admin-muted">{s.plan}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: st.bg, color: st.fg }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right v-numeric" style={{ color: "hsl(var(--admin-fg))" }}>
                        {s.screens_count}
                      </td>
                      <td className="px-4 py-3.5 text-right v-numeric font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
                        {fmtCOP(Number(s.total_amount))}
                      </td>
                      <td className="px-4 py-3.5 admin-muted v-numeric">
                        {s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString("es-CO") : "—"}
                      </td>
                      <td className="px-4 py-3.5 admin-muted v-numeric">
                        {new Date(s.created_at).toLocaleDateString("es-CO")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
