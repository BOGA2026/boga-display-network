/**
 * UptimeChart (charts/) — sólo el gráfico de barras de uptime, sin fetching.
 * Aislado para cargarlo con React.lazy: el contenedor pinta cabecera y datos
 * mientras baja el chunk de recharts.
 */
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface UptimeRow {
  day: string;
  Encendida: number;
  Apagada: number;
}

export default function UptimeChart({ rows, height = 180 }: { rows: UptimeRow[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
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
  );
}
