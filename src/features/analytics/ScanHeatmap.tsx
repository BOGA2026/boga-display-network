/**
 * Mapa de calor de hora pico de escaneos.
 *
 * Sólo se monta cuando ya hay al menos 14 días de escaneos: un mapa de calor
 * vacío son 168 celdas grises, el peor estado vacío posible.
 *
 * Eje X: hora del día (0-23). Eje Y: día de la semana. Intensidad: escaneos.
 */
import { useMemo } from "react";
import type { ScanHeatmapCell } from "@/hooks/useAnalytics";

/** Semana colombiana: arranca en lunes. `dow` de Postgres: 0 = domingo. */
const DIAS: { dow: number; label: string; full: string }[] = [
  { dow: 1, label: "Lu", full: "los lunes" },
  { dow: 2, label: "Ma", full: "los martes" },
  { dow: 3, label: "Mi", full: "los miércoles" },
  { dow: 4, label: "Ju", full: "los jueves" },
  { dow: 5, label: "Vi", full: "los viernes" },
  { dow: 6, label: "Sa", full: "los sábados" },
  { dow: 0, label: "Do", full: "los domingos" },
];

const HORAS = Array.from({ length: 24 }, (_, h) => h);

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export interface ScanHeatmapProps {
  cells: ScanHeatmapCell[];
}

/** Lectura automática: la franja de 2 horas y el día con más escaneos. */
export function leerPico(cells: ScanHeatmapCell[]): string | null {
  if (cells.length === 0) return null;
  const grid = new Map<string, number>();
  for (const c of cells) grid.set(`${c.dow}-${c.hour}`, (grid.get(`${c.dow}-${c.hour}`) ?? 0) + c.scans);

  let best = { dow: -1, hour: 0, total: 0 };
  for (const d of DIAS) {
    for (let h = 0; h < 23; h++) {
      const total = (grid.get(`${d.dow}-${h}`) ?? 0) + (grid.get(`${d.dow}-${h + 1}`) ?? 0);
      if (total > best.total) best = { dow: d.dow, hour: h, total };
    }
  }
  if (best.total === 0) return null;
  const dia = DIAS.find((d) => d.dow === best.dow)!;
  return `Tu hora de mayor actividad es entre las ${hh(best.hour)} y las ${hh(best.hour + 2)} ${dia.full}.`;
}

export default function ScanHeatmap({ cells }: ScanHeatmapProps) {
  const { grid, max, total } = useMemo(() => {
    const g = new Map<string, number>();
    let m = 0;
    let t = 0;
    for (const c of cells) {
      const key = `${c.dow}-${c.hour}`;
      const v = (g.get(key) ?? 0) + c.scans;
      g.set(key, v);
      if (v > m) m = v;
      t += c.scans;
    }
    return { grid: g, max: m, total: t };
  }, [cells]);

  const lectura = useMemo(() => leerPico(cells), [cells]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Rejilla: fila de etiqueta + 24 celdas */}
          <div className="space-y-1">
            {DIAS.map((d) => (
              <div key={d.dow} className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))] items-center gap-1">
                <span className="text-[11px] text-muted-foreground">{d.label}</span>
                {HORAS.map((h) => {
                  const v = grid.get(`${d.dow}-${h}`) ?? 0;
                  const intensidad = max > 0 ? v / max : 0;
                  const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                  return (
                    <div
                      key={h}
                      title={`${d.label} ${hh(h)} · ${v.toLocaleString("es-CO")} escaneos (${pct}%)`}
                      aria-label={`${d.label} ${hh(h)}: ${v} escaneos`}
                      className="aspect-square rounded-[3px] border border-border/40"
                      style={{
                        backgroundColor:
                          v === 0
                            ? "hsl(var(--muted) / 0.35)"
                            : `hsl(var(--primary) / ${0.15 + intensidad * 0.85})`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
            {/* Eje X: sólo cada 3 horas para que respire */}
            <div className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))] gap-1 pt-1">
              <span />
              {HORAS.map((h) => (
                <span key={h} className="text-center text-[10px] text-muted-foreground">
                  {h % 3 === 0 ? h : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {lectura && <p className="text-sm text-foreground">{lectura}</p>}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Menos</span>
          {[0.15, 0.4, 0.65, 0.85, 1].map((a) => (
            <span
              key={a}
              className="h-3 w-3 rounded-[3px] border border-border/40"
              style={{ backgroundColor: `hsl(var(--primary) / ${a})` }}
            />
          ))}
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}
