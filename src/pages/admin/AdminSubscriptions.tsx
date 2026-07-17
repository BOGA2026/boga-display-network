import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CreditCard, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";

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

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active: { label: "Activa", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  trial: { label: "Prueba", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  trialing: { label: "Prueba", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  past_due: { label: "Vencida", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  canceled: { label: "Cancelada", cls: "bg-muted text-muted-foreground border-border/50" },
  cancelled: { label: "Cancelada", cls: "bg-muted text-muted-foreground border-border/50" },
  paused: { label: "Pausada", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
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
    const active = subs.filter(s => s.status === "active");
    return {
      total: active.length,
      trial: subs.filter(s => s.status === "trial" || s.status === "trialing").length,
      canceled: subs.filter(s => s.status === "canceled" || s.status === "cancelled").length,
      mrr: active.reduce((acc, s) => acc + Number(s.total_amount || 0) * (s.billing_cycle === "yearly" ? 1 / 12 : 1), 0),
    };
  }, [subs]);

  const plans = useMemo(() => Array.from(new Set(subs.map(s => s.plan).filter(Boolean))), [subs]);

  const filtered = subs.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (planFilter !== "all" && s.plan !== planFilter) return false;
    if (search && !s.businesses?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const kpiCards = [
    { label: "Activas", value: kpis.total, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "En prueba", value: kpis.trial, icon: Clock, color: "text-amber-400" },
    { label: "Canceladas", value: kpis.canceled, icon: XCircle, color: "text-red-400" },
    { label: "MRR estimado", value: fmtCOP(kpis.mrr), icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suscripciones activas</h1>
        <p className="text-sm text-muted-foreground">Estado de suscripciones por negocio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 bg-background/40 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            {loading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{value}</div>}
          </Card>
        ))}
      </div>

      <Card className="bg-background/40 border-border/50">
        <div className="p-4 border-b border-border/50 flex items-center gap-2 flex-wrap">
          <Input placeholder="Buscar negocio..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs bg-background/60" />
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="rounded-md border border-border/50 bg-background/60 px-3 py-2 text-sm">
            <option value="all">Todos los planes</option>
            {plans.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-border/50 bg-background/60 px-3 py-2 text-sm">
            <option value="all">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="trial">Prueba</option>
            <option value="past_due">Vencida</option>
            <option value="canceled">Cancelada</option>
          </select>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} resultados</span>
        </div>

        {error && <div className="p-4 text-destructive text-sm">Error: {error}</div>}
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Sin suscripciones que coincidan con los filtros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="text-left p-3">Negocio</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Pantallas</th>
                  <th className="text-left p-3">Monto</th>
                  <th className="text-left p-3">Próximo cobro</th>
                  <th className="text-left p-3">Inicio</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const st = STATUS_LABELS[s.status] ?? { label: s.status, cls: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={s.id} className="border-b border-border/30 hover:bg-white/5">
                      <td className="p-3 font-medium">{s.businesses?.name ?? "—"}</td>
                      <td className="p-3">{s.plan}</td>
                      <td className="p-3"><span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] uppercase ${st.cls}`}>{st.label}</span></td>
                      <td className="p-3">{s.screens_count}</td>
                      <td className="p-3">{fmtCOP(Number(s.total_amount))}</td>
                      <td className="p-3 text-muted-foreground">{s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString("es-CO") : "—"}</td>
                      <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("es-CO")}</td>
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
