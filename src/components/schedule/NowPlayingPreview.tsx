import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tv, Clock, Calendar } from "lucide-react";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";

const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Props {
  blocks: ScheduleBlock[];
  layers: ScheduleLayer[];
  selectedBlockId: string | null;
}

function getCurrentDayIndex(): number {
  return new Date().getDay(); // 0=Sun
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

const NowPlayingPreview = ({ blocks, layers, selectedBlockId }: Props) => {
  const dayIndex = getCurrentDayIndex();
  const now = getCurrentTime();

  const layerMap = useMemo(() => {
    const m = new Map<string, ScheduleLayer>();
    layers.forEach((l) => m.set(l.id, l));
    return m;
  }, [layers]);

  // Find what's playing now
  const nowPlaying = useMemo(() => {
    return blocks
      .filter(
        (b) =>
          b.is_enabled &&
          b.days_of_week.includes(dayIndex) &&
          b.start_time.slice(0, 5) <= now &&
          b.end_time.slice(0, 5) > now
      )
      .sort((a, b) => {
        const la = layerMap.get(a.layer_id);
        const lb = layerMap.get(b.layer_id);
        return (lb?.priority || 0) - (la?.priority || 0);
      });
  }, [blocks, dayIndex, now, layerMap]);

  // Upcoming blocks today
  const upcoming = useMemo(() => {
    return blocks
      .filter(
        (b) =>
          b.is_enabled &&
          b.days_of_week.includes(dayIndex) &&
          b.start_time.slice(0, 5) > now
      )
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .slice(0, 3);
  }, [blocks, dayIndex, now]);

  const active = nowPlaying[0];
  const activeLayer = active ? layerMap.get(active.layer_id) : null;

  return (
    <div className="w-72 flex flex-col rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Tv className="h-4 w-4 text-primary" />
          Qué se verá ahora
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {DAYS_SHORT[dayIndex]} · {now}
        </p>
      </div>

      {/* Now playing */}
      <div className="p-5">
        {active ? (
          <div
            className="rounded-xl p-4 border-2"
            style={{
              background: `linear-gradient(145deg, ${activeLayer?.color || "#8A00FF"}22, ${activeLayer?.color || "#8A00FF"}08)`,
              borderColor: `${activeLayer?.color || "#8A00FF"}40`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="h-3 w-3 rounded-full animate-pulse"
                style={{ background: activeLayer?.color || "#8A00FF" }}
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Reproduciendo
              </span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {active.playlist?.name || active.name || "Sin nombre"}
            </div>
            <div className="text-sm text-muted-foreground mt-1 font-mono flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {active.start_time.slice(0, 5)} – {active.end_time.slice(0, 5)}
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4 bg-secondary/30 border border-border/30 text-center">
            <Tv className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground font-medium">
              No hay contenido programado ahora
            </div>
            <div className="text-xs text-muted-foreground/60 mt-1">
              Agrega contenido para empezar
            </div>
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="px-5 pb-5">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Próximos hoy
          </h4>
          <div className="space-y-2">
            {upcoming.map((block) => {
              const layer = layerMap.get(block.layer_id);
              return (
                <div
                  key={block.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-2.5 transition-colors",
                    selectedBlockId === block.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary/20 hover:bg-secondary/40"
                  )}
                >
                  <span
                    className="h-8 w-1 rounded-full shrink-0"
                    style={{ background: layer?.color || "hsl(var(--muted-foreground))" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {block.playlist?.name || block.name || "Sin nombre"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-auto px-5 py-3 border-t border-border/30 bg-secondary/10">
        <div className="text-xs text-muted-foreground text-center">
          {blocks.filter((b) => b.is_enabled).length} contenido{blocks.filter((b) => b.is_enabled).length !== 1 && "s"} programado{blocks.filter((b) => b.is_enabled).length !== 1 && "s"}
        </div>
      </div>
    </div>
  );
};

export default NowPlayingPreview;
