import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Activity, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { AdminKpiCard, AdminPageHeader } from "@/components/admin/AdminUI";

type Row = { started_at: string; user_id: string; last_ping_at: string };
type Profile = { id: string; created_at: string };

export default function AdminTraffic() {
  const [range, setRange] = useState<7 | 14 | 30>(30);
  const [sessions, setSessions] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = subDays(new Date(), range).toISOString();
      const [s, p] = await Promise.all([
        supabase.from("user_sessions").select("started_at,user_id,last_ping_at").gte("started_at", since).order("started_at", { ascending: false }),
        supabase.from("profiles").select("id,created_at").gte("created_at", subDays(new Date(), 30).toISOString()),
      ]);
      if (s.error) setError(s.error.message);
      else setSessions(s.data ?? []);
      if (!p.error) setProfiles(p.data ?? []);
      setLoading(false);
    })();
  }, [range]);

  const kpis = useMemo(() => {
    const now = new Date();
    const d1 = startOfDay(now).getTime();
    const d7 = subDays(now, 7).getTime();
    const d30 = subDays(now, 30).getTime();
    const active = (since: number) =>
      new Set(sessions.filter((s) => new Date(s.last_ping_at).getTime() >= since).map((s) => s.user_id)).size;
    return {
      today: active(d1),
      week: active(d7),
      month: active(d30),
      sessions: sessions.length,
      newUsers: profiles.filter((p) => new Date(p.created_at).getTime() >= d7).length,
    };
  }, [sessions, profiles]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, Set<string>>();
    const sessionBuckets = new Map<string, number>();
    for (let i = range - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      buckets.set(d, new Set());
      sessionBuckets.set(d, 0);
    }
    for (const s of sessions) {
      const d = format(new Date(s.started_at), "yyyy-MM-dd");
      if (!buckets.has(d)) continue;
      buckets.get(d)!.add(s.user_id);
      sessionBuckets.set(d, (sessionBuckets.get(d) || 0) + 1);
    }
    return Array.from(buckets.entries()).map(([date, users]) => ({
      date: format(new Date(date), "d MMM", { locale: es }),
      "Usuarios únicos": users.size,
      Sesiones: sessionBuckets.get(date) || 0,
    }));
  }, [sessions, range]);

  const hasData = chartData.some((d) => d["Usuarios únicos"] > 0 || d.Sesiones > 0);

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <AdminPageHeader
        title="Tráfico"
        subtitle="Sesiones y usuarios activos en la plataforma"
        actions={
          <div
            className="inline-flex rounded-md p-1 gap-1"
            style={{ background: "hsl(var(--admin-surface))", border: "1px solid hsl(var(--admin-border))" }}
          >
            {[7, 14, 30].map((n) => (
              <button
                key={n}
                onClick={() => setRange(n as 7 | 14 | 30)}
                className="px-3 h-7 text-[12px] rounded font-medium transition-colors"
                style={
                  range === n
                    ? { background: "hsl(var(--admin-accent) / 0.18)", color: "hsl(var(--admin-fg))" }
                    : { color: "hsl(var(--admin-fg-muted))", background: "transparent" }
                }
              >
                {n} días
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="text-[13px]" style={{ color: "hsl(var(--admin-danger))" }}>
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminKpiCard label="Activos hoy" value={kpis.today} icon={Users} tone="accent" loading={loading} />
        <AdminKpiCard label="Activos 7 días" value={kpis.week} icon={Activity} tone="success" loading={loading} />
        <AdminKpiCard label="Activos 30 días" value={kpis.month} icon={TrendingUp} tone="neutral" loading={loading} />
        <AdminKpiCard label="Nuevos usuarios (7d)" value={kpis.newUsers} icon={UserPlus} tone="warning" loading={loading} />
      </div>

      <div className="admin-card p-6">
        <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
              Actividad diaria
            </h2>
            <p className="text-[12px] admin-muted mt-1">
              Últimos {range} días · {kpis.sessions} sesiones registradas
            </p>
          </div>
        </div>

        {loading ? (
          <div className="h-72 rounded animate-pulse" style={{ background: "hsl(var(--admin-surface-2))" }} />
        ) : !hasData ? (
          <div className="h-72 flex items-center justify-center text-[13px] admin-muted text-center px-6">
            Aún no hay datos de sesiones. Se registrarán a medida que los usuarios entren a la plataforma.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--admin-border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--admin-fg-muted))"
                fontSize={11}
                tickMargin={8}
                axisLine={{ stroke: "hsl(var(--admin-border))" }}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--admin-fg-muted))"
                fontSize={11}
                allowDecimals={false}
                tickMargin={6}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Cantidad",
                  angle: -90,
                  position: "insideLeft",
                  offset: 16,
                  style: { fill: "hsl(var(--admin-fg-dim))", fontSize: 11 },
                }}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--admin-accent))", strokeWidth: 1, strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "hsl(var(--admin-surface))",
                  border: "1px solid hsl(var(--admin-border-strong))",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "hsl(var(--admin-fg))",
                  boxShadow: "0 8px 24px hsl(0 0% 0% / 0.5)",
                }}
                labelStyle={{ color: "hsl(var(--admin-fg-muted))", marginBottom: 4 }}
              />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "hsl(var(--admin-fg-muted))" }}
              />
              <Line
                type="monotone"
                dataKey="Usuarios únicos"
                stroke="hsl(var(--admin-accent))"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="Sesiones"
                stroke="hsl(var(--admin-success))"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
