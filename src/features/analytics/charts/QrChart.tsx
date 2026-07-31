/**
 * QrChart — sólo la parte de recharts de las analíticas de QR.
 * Se aísla en su propio archivo para poder cargarlo con React.lazy y que el
 * chunk de recharts no bloquee el primer render de las tarjetas y las tablas.
 */
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
} as const;

export type QrChartProps =
  | { variant: "timeline"; data: { label: string; scans: number }[] }
  | { variant: "locations"; data: { key: string; count: number }[] };

export default function QrChart(props: QrChartProps) {
  if (props.variant === "timeline") {
    return (
      <ResponsiveContainer>
        <AreaChart data={props.data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="qrScanFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "hsl(var(--muted-foreground))" }} />
          <Area type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#qrScanFill)" isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <BarChart data={props.data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="key" width={130} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} isAnimationActive />
      </BarChart>
    </ResponsiveContainer>
  );
}
