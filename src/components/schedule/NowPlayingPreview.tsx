import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tv, Clock, Calendar, MonitorPlay, ArrowRight } from "lucide-react";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";
import {
  nowLocalDayIndex,
  nowLocalMinutes,
  nowLocalTime,
  timeToMinutes,
  timeZoneLabel,
  DEFAULT_TIMEZONE,
} from "@/lib/businessTime";

const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Props {
  blocks: ScheduleBlock[];
  layers: ScheduleLayer[];
  selectedBlockId: string | null;
  /** Zona horaria del negocio. El "ahora" se calcula acá, no en el navegador. */
  timezone?: string;
  /** Nombres de otras pantallas con la misma programación. */
  sharedScreens?: string[];
}

function formatHoras(minutes: number): string {
  if (minutes <= 0) return "0 h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const NowPlayingPreview = ({
  blocks,
  layers,
  selectedBlockId,
  timezone = DEFAULT_TIMEZONE,
  sharedScreens = [],
}: Props) => {
  // El panel calcula con la hora del negocio: si el dueño administra desde
  // otro huso, igual ve lo que su local está mostrando.
  const dayIndex = nowLocalDayIndex(timezone);
  const now = nowLocalTime(timezone);
  const nowMin = nowLocalMinutes(timezone);
  const tzLabel = timeZoneLabel(timezone);

  const layerMap = useMemo(() => {
    const m = new Map<string, ScheduleLayer>();
    layers.forEach((l) => m.set(l.id, l));
    return m;
  }, [layers]);

  const todayBlocks = useMemo(
    () => blocks.filter((b) => b.is_enabled && b.days_of_week.includes(dayIndex)),
    [blocks, dayIndex],
  );

  const nowPlaying = useMemo(
    () =>
      todayBlocks
        .filter((b) => b.start_time.slice(0, 5) <= now && b.end_time.slice(0, 5) > now)
        .sort((a, b) => (layerMap.get(b.layer_id)?.priority || 0) - (layerMap.get(a.layer_id)?.priority || 0)),
    [todayBlocks, now, layerMap],
  );

  const upcoming = useMemo(
    () =>
      todayBlocks
        .filter((b) => b.start_time.slice(0, 5) > now)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [todayBlocks, now],
  );

  const active = nowPlaying[0];
  const activeLayer = active ? layerMap.get(active.layer_id) : null;

  // Próximo cambio: fin del bloque activo o inicio del siguiente.
  const nextChange = useMemo(() => {
    if (active) return { time: active.end_time.slice(0, 5), label: "Termina" };
    if (upcoming[0]) return { time: upcoming[0].start_time.slice(0, 5), label: "Empieza" };
    return null;
  }, [active, upcoming]);

  const minutesToNextChange = nextChange ? timeToMinutes(nextChange.time) - nowMin : null;

  // Horas al aire del día: unión de los rangos programados hoy.
  const airMinutes = useMemo(() => {
    const ranges = todayBlocks
      .map((b) => [timeToMinutes(b.start_time), timeToMinutes(b.end_time)] as [number, number])
      .sort((a, b) => a[0] - b[0]);
    let total = 0;
    let cursor = -1;
    for (const [s, e] of ranges) {
      const start = Math.max(s, cursor);
      if (e > start) {
        total += e - start;
        cursor = e;
      }
    }
    return total;
  }, [todayBlocks]);

  return (
    <aside className="w-full lg:w-72 shrink-0 self-start rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Tv className="h-4 w-4 text-primary" />
          Qué se verá ahora
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {DAYS_SHORT[dayIndex]} · {now} hora del local{tzLabel ? ` (${tzLabel})` : ""}
        </p>
      </div>

      {/* Al aire */}
      <div className="p-4">
        {active ? (
          <div
            className="rounded-xl p-3 border"
            style={{
              background: `linear-gradient(145deg, ${activeLayer?.color || "hsl(var(--primary))"}22, transparent)`,
              borderColor: `${activeLayer?.color || "#8A00FF"}40`,
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="v-dot v-dot-live" style={{ background: activeLayer?.color || "hsl(var(--primary))" }} />
              <span className="v-kpi-label">Al aire</span>
            </div>
            <div className="text-base font-bold text-foreground leading-tight">
              {active.playlist?.name || active.name || "Sin nombre"}
            </div>
            <div className="text-xs text-muted-foreground mt-1 v-numeric flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {active.start_time.slice(0, 5)} – {active.end_time.slice(0, 5)}
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-3 bg-secondary/30 border border-border/30 text-center">
            <Tv className="h-7 w-7 text-muted-foreground/40 mx-auto mb-1.5" />
            <div className="text-sm text-muted-foreground font-medium">Sin contenido en este momento</div>
            <div className="text-xs text-muted-foreground/60 mt-0.5">
              {upcoming[0]
                ? `Lo próximo empieza a las ${upcoming[0].start_time.slice(0, 5)}`
                : "No hay nada programado para hoy"}
            </div>
          </div>
        )}
      </div>

      {/* Resumen del día */}
      <div className="px-4 pb-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/20 px-3 py-2">
          <span className="v-kpi-label">Próximo cambio</span>
          <span className="text-xs font-semibold text-foreground v-numeric text-right">
            {nextChange
              ? `${nextChange.time}${minutesToNextChange !== null && minutesToNextChange > 0 ? ` · en ${formatHoras(minutesToNextChange)}` : ""}`
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/20 px-3 py-2">
          <span className="v-kpi-label">Horas al aire hoy</span>
          <span className="text-xs font-semibold text-foreground v-numeric">{formatHoras(airMinutes)}</span>
        </div>
        <div className="rounded-lg bg-secondary/20 px-3 py-2">
          <span className="v-kpi-label flex items-center gap-1.5">
            <MonitorPlay className="h-3 w-3" />
            Misma programación
          </span>
          <p className="mt-1 text-xs text-foreground">
            {sharedScreens.length > 0
              ? `Comparten con ${sharedScreens.length} pantalla${sharedScreens.length > 1 ? "s" : ""}: ${sharedScreens.join(", ")}`
              : "Solo esta pantalla"}
          </p>
        </div>
      </div>

      {/* Próximos hoy */}
      {upcoming.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="v-kpi-label mb-2 flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Próximos hoy
          </h4>
          <div className="space-y-1.5">
            {upcoming.slice(0, 3).map((block) => {
              const layer = layerMap.get(block.layer_id);
              return (
                <div
                  key={block.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg p-2 transition-colors",
                    selectedBlockId === block.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary/20 hover:bg-secondary/40",
                  )}
                >
                  <span
                    className="h-7 w-1 rounded-full shrink-0"
                    style={{ background: layer?.color || "hsl(var(--muted-foreground))" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {block.playlist?.name || block.name || "Sin nombre"}
                    </div>
                    <div className="text-xs text-muted-foreground v-numeric flex items-center gap-1">
                      {block.start_time.slice(0, 5)}
                      <ArrowRight className="h-3 w-3" />
                      {block.end_time.slice(0, 5)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

export default NowPlayingPreview;
