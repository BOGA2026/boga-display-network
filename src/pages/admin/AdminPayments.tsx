import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CalendarClock, CheckCircle2 } from "lucide-react";
import { useAdminBusinessStats, statusMeta, fmtCOP } from "@/hooks/useAdminBusinessStats";

export default function AdminPayments() {
  const { rows, isLoading: loading, error } = useAdminBusinessStats();
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const enriched = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return rows
      .filter((r) => r.subscription_id && r.next_billing_date && r.status !== "canceled" && r.status !== "paused")
      .map((r) => {
        const due = new Date(`${r.next_billing_date}T00:00:00`);
        const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
        const tone: "ok" | "warn" | "danger" =
          r.status === "past_due" ? "danger" : r.status === "grace" || days <= 7 ? "warn" : "ok";
        return { ...r, days, tone };
      })
      .sort((a, b) => (sortDir === "asc" ? a.days - b.days : b.days - a.days));
  }, [rows, sortDir]);

  const overdue = enriched.filter((r) => r.tone === "danger").length;
  const soon = enriched.filter((r) => r.tone === "warn").length;
  const ok = enriched.filter((r) => r.tone === "ok").length;

  const kpis = [
    { label: "Vencidos", value: overdue, icon: AlertCircle, color: "text-red-400" },
    { label: "Por vencer (≤7d)", value: soon, icon: CalendarClock, color: "text-amber-400" },
    { label: "Al día", value: ok, icon: CheckCircle2, color: "text-emerald-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vencimiento de pagos</h1>
        <p className="text-sm text-muted-foreground">Suscripciones con próximo cobro programado</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 bg-background/40 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            {loading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
          </Card>
        ))}
      </div>

      <Card className="bg-background/40 border-border/50">
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <span className="text-sm font-medium">{enriched.length} suscripciones</span>
          <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} className="text-xs text-primary hover:underline">
            Ordenar por vencimiento: {sortDir === "asc" ? "más cercano" : "más lejano"}
          </button>
        </div>
        {error && <div className="p-4 text-destructive text-sm">Error: {(error as Error).message}</div>}
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : enriched.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No hay pagos programados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="text-left p-3">Negocio</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-left p-3">Próximo pago</th>
                  <th className="text-left p-3">Días</th>
                  <th className="text-left p-3">Valor mensual</th>
                  <th className="text-left p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((r) => {
                  const badge =
                    r.tone === "danger"
                      ? "bg-red-500/15 text-red-400 border-red-500/30"
                      : r.tone === "warn"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                  const daysText =
                    r.days < 0 ? `Vencido hace ${Math.abs(r.days)} días` : r.days === 0 ? "Vence hoy" : `En ${r.days} días`;
                  return (
                    <tr key={r.subscription_id} className="border-b border-border/30">
                      <td className="p-3 font-medium">{r.business_name}</td>
                      <td className="p-3">{r.plan ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{new Date(`${r.next_billing_date}T00:00:00`).toLocaleDateString("es-CO")}</td>
                      <td className="p-3 whitespace-nowrap">{daysText}</td>
                      <td className="p-3">{fmtCOP((r.price_per_screen ?? 0) * r.screens_total)}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs uppercase ${badge}`}>
                          {statusMeta(r.status).label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
