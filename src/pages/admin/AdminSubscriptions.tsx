import { useMemo, useState } from "react";
import { CreditCard, CheckCircle2, XCircle, Clock, DollarSign, Search } from "lucide-react";
import { AdminKpiCard, AdminPageHeader } from "@/components/admin/AdminUI";
import {
  useAdminBusinessStats,
  statusMeta,
  TONE_STYLE,
  fmtCOP,
} from "@/hooks/useAdminBusinessStats";

export default function AdminSubscriptions() {
  const { rows, isLoading: loading, error, totals } = useAdminBusinessStats();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const subs = useMemo(() => rows.filter((r) => r.subscription_id), [rows]);

  const kpis = useMemo(
    () => ({
      total: totals.activeSubscriptions,
      trial: subs.filter((s) => s.status === "trialing").length,
      canceled: subs.filter((s) => s.status === "canceled" || s.status === "paused").length,
      pastDue: totals.pastDue,
      mrr: totals.mrr,
    }),
    [subs, totals],
  );

  const plans = useMemo(
    () => Array.from(new Set(subs.map((s) => s.plan).filter(Boolean))) as string[],
    [subs],
  );

  const filtered = subs.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (planFilter !== "all" && s.plan !== planFilter) return false;
    if (search && !s.business_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <AdminPageHeader title="Suscripciones" subtitle="Estado de suscripciones por negocio" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminKpiCard label="Vigentes" value={kpis.total} icon={CheckCircle2} tone="success" loading={loading} hint="Activas y en periodo de gracia" />
        <AdminKpiCard label="Vencidas" value={kpis.pastDue} icon={XCircle} tone="danger" loading={loading} />
        <AdminKpiCard label="En prueba" value={kpis.trial} icon={Clock} tone="warning" loading={loading} />
        <AdminKpiCard
          label="MRR estimado"
          value={fmtCOP(kpis.mrr)}
          icon={DollarSign}
          tone="accent"
          loading={loading}
          hint="Precio por pantalla × pantallas reales, solo suscripciones vigentes."
        />
      </div>

      <div className="admin-card overflow-hidden">
        <div className="p-4 flex items-center gap-2 flex-wrap" style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}>
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 admin-dim" />
            <input
              placeholder="Buscar negocio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-md pl-9 pr-3 text-[13px]"
            />
          </div>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="h-9 rounded-md px-3 text-[13px]">
            <option value="all">Todos los planes</option>
            {plans.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-md px-3 text-[13px]">
            <option value="all">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="grace">En periodo de gracia</option>
            <option value="trialing">Prueba</option>
            <option value="past_due">Vencida</option>
            <option value="canceled">Cancelada</option>
          </select>
          <span className="ml-auto text-[12px] admin-muted">{filtered.length} resultados</span>
        </div>

        {error && (
          <div className="p-4 text-[13px]" style={{ color: "hsl(var(--admin-danger))" }}>
            Error: {(error as Error).message}
          </div>
        )}

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
                <tr className="text-xs uppercase tracking-wider admin-dim" style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}>
                  <th className="text-left px-4 py-3 font-medium">Negocio</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 font-medium">Pantallas</th>
                  <th className="text-right px-4 py-3 font-medium">Valor mensual</th>
                  <th className="text-left px-4 py-3 font-medium">Próximo cobro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const meta = statusMeta(s.status);
                  const style = TONE_STYLE[meta.tone];
                  return (
                    <tr key={s.subscription_id} className="admin-card-hover transition-colors" style={{ borderBottom: "1px solid hsl(var(--admin-border) / 0.6)" }}>
                      <td className="px-4 py-3.5 font-medium" style={{ color: "hsl(var(--admin-fg))" }}>{s.business_name}</td>
                      <td className="px-4 py-3.5 admin-muted">{s.plan ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: style.bg, color: style.fg }}>
                          {meta.label}
                          {s.days_overdue > 0 ? ` · ${s.days_overdue} d` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right v-numeric" style={{ color: "hsl(var(--admin-fg))" }}>{s.screens_total}</td>
                      <td className="px-4 py-3.5 text-right v-numeric font-medium" style={{ color: "hsl(var(--admin-fg))" }}>
                        {fmtCOP((s.price_per_screen ?? 0) * s.screens_total)}
                      </td>
                      <td className="px-4 py-3.5 v-numeric" style={{ color: s.days_overdue > 0 ? "hsl(var(--admin-danger))" : undefined }}>
                        {s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString("es-CO") : "—"}
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
