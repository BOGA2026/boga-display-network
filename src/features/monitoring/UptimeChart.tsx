import { useQuery } from "@tanstack/react-query";
import { fetchUptimeByDay } from "./api";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { filterQueryOptions } from "@/lib/query-client";
import { Loader2 } from "lucide-react";

export default function UptimeChart({ deviceId, days = 7 }: { deviceId: string; days?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["uptime", deviceId, days],
    queryFn: () => fetchUptimeByDay(deviceId, days),
    ...filterQueryOptions,
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rows = (data ?? []).map((d) => ({
    day: d.date.slice(5), // MM-DD
    Encendida: d.onHours,
    Apagada: d.offHours,
  }));

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">Horas encendida (últimos {days} días)</h4>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Encendida</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-neutral-500" /> Apagada</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 24]} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="Encendida" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Apagada" stackId="a" fill="#6b7280" radius={[0, 0, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
