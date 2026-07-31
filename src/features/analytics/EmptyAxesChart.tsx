/**
 * EmptyAxesChart — gráfico con ejes y rejilla dibujados pero SIN serie.
 *
 * Por qué existe: un rectángulo vacío no comunica nada. Unos ejes con su
 * rejilla dicen "aquí va a haber una curva" y enseñan qué se va a medir.
 * Nunca dibuja una serie en cero: eso afirmaría que medimos y dio cero.
 */
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export interface EmptyAxesChartProps {
  /** Etiquetas del eje X (días del periodo). */
  labels: string[];
  /** Tope del eje Y para que la rejilla tenga escala creíble. */
  yMax?: number;
  /** Sufijo de la escala Y, p. ej. "%" o " h". */
  yUnit?: string;
  height?: number;
  message?: string;
}

export default function EmptyAxesChart({
  labels,
  yMax = 100,
  yUnit = "",
  height = 220,
  message = "Sin datos en este periodo",
}: EmptyAxesChartProps) {
  // Sólo alimenta el eje X: `value` queda indefinido, así que no hay curva.
  const data = labels.map((label) => ({ label, value: undefined as number | undefined }));

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            domain={[0, yMax]}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickFormatter={(v: number) => `${v}${yUnit}`}
          />
          <Area dataKey="value" stroke="transparent" fill="transparent" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="rounded-full bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          {message}
        </span>
      </div>
    </div>
  );
}
