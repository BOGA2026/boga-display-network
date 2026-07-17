import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Activity, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

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
    const active = (since: number) => new Set(sessions.filter(s => new Date(s.last_ping_at).getTime() >= since).map(s => s.user_id)).size;
    return {
      today: active(d1),
      week: active(d7),
      month: active(d30),
      sessions: sessions.length,
      newUsers: profiles.filter(p => new Date(p.created_at).getTime() >= d7).length,
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
      Usuarios: users.size,
      Sesiones: sessionBuckets.get(date) || 0,
    }));
  }, [sessions, range]);

  const kpiCards = [
    { label: "Activos hoy", value: kpis.today, icon: Users, color: "text-cyan-400" },
    { label: "Activos 7 días", value: kpis.week, icon: Activity, color: "text-purple-400" },
    { label: "Activos 30 días", value: kpis.month, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Nuevos (7d)", value: kpis.newUsers, icon: UserPlus, color: "text-amber-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tráfico de usuarios</h1>
          <p className="text-sm text-muted-foreground">Sesiones y usuarios activos</p>
        </div>
        <div className="flex gap-1 rounded-md border border-border/50 bg-background/40 p-1">
          {[7, 14, 30].map((n) => (
            <button
              key={n}
              onClick={() => setRange(n as 7 | 14 | 30)}
              className={`px-3 py-1 text-xs rounded ${range === n ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {n} días
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-destructive text-sm">Error: {error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 bg-background/40 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            {loading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-background/40 border-border/50">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Actividad diaria</h2>
          <span className="text-xs text-muted-foreground">Últimos {range} días • {kpis.sessions} sesiones</span>
        </div>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.every(d => d.Usuarios === 0 && d.Sesiones === 0) ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Aún no hay datos de sesiones. Se registrarán a medida que los usuarios entren a la plataforma.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="Usuarios" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Sesiones" stroke="hsl(190 90% 55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
