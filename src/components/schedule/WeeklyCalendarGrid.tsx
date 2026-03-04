import { useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, CalendarDays, Calendar, List } from "lucide-react";
import ScheduleBlockCard from "./ScheduleBlockCard";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

const ZOOM_LEVELS = [60, 30, 15];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

interface Props {
  blocks: ScheduleBlock[];
  layers: ScheduleLayer[];
  filterLayerId: string | null;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onMoveBlock: (id: string, newStart: string, newEnd: string, dayIndex: number) => void;
  conflicts: Map<string, string[]>;
}

type ViewMode = "week" | "day" | "list";

const WeeklyCalendarGrid = ({
  blocks,
  layers,
  filterLayerId,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  conflicts,
}: Props) => {
  const [zoom, setZoom] = useState(30);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [focusDay, setFocusDay] = useState(0); // index in DAY_INDICES

  const slotsPerHour = 60 / zoom;
  const totalSlots = 24 * slotsPerHour;
  const slotHeight = zoom === 15 ? 18 : zoom === 30 ? 28 : 44;
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState<{
    blockId: string;
    mode: "move" | "resize-end";
    startY: number;
    origStart: number;
    origEnd: number;
    dayIdx: number;
  } | null>(null);

  const filteredBlocks = useMemo(() => {
    let b = blocks;
    if (filterLayerId) b = b.filter((bl) => bl.layer_id === filterLayerId);
    return b;
  }, [blocks, filterLayerId]);

  const getBlocksForDay = useCallback(
    (dayIndex: number) => filteredBlocks.filter((b) => b.days_of_week.includes(dayIndex)),
    [filteredBlocks]
  );

  const layerMap = useMemo(() => {
    const m = new Map<string, ScheduleLayer>();
    layers.forEach((l) => m.set(l.id, l));
    return m;
  }, [layers]);

  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < totalSlots; i++) {
      const mins = i * zoom;
      if (mins % 60 === 0) labels.push(minutesToTime(mins));
      else labels.push("");
    }
    return labels;
  }, [totalSlots, zoom]);

  const handleMouseDown = (
    e: React.MouseEvent,
    blockId: string,
    mode: "move" | "resize-end",
    dayIdx: number
  ) => {
    e.stopPropagation();
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    setDragging({
      blockId,
      mode,
      startY: e.clientY,
      origStart: timeToMinutes(block.start_time),
      origEnd: timeToMinutes(block.end_time),
      dayIdx,
    });
    onSelectBlock(blockId);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dy = e.clientY - dragging.startY;
      const slotDelta = Math.round(dy / slotHeight);
      const minuteDelta = slotDelta * zoom;

      if (dragging.mode === "move") {
        const dur = dragging.origEnd - dragging.origStart;
        const newStart = Math.max(0, Math.min(24 * 60 - dur, dragging.origStart + minuteDelta));
        onMoveBlock(dragging.blockId, minutesToTime(newStart), minutesToTime(newStart + dur), dragging.dayIdx);
      } else {
        const newEnd = Math.max(dragging.origStart + zoom, Math.min(24 * 60, dragging.origEnd + minuteDelta));
        onMoveBlock(dragging.blockId, minutesToTime(dragging.origStart), minutesToTime(newEnd), dragging.dayIdx);
      }
    },
    [dragging, slotHeight, zoom, onMoveBlock]
  );

  const handleMouseUp = () => setDragging(null);

  const zoomIn = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1]);
  };
  const zoomOut = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1]);
  };

  // Determine which day columns to render
  const dayColumns = viewMode === "day" ? [focusDay] : Array.from({ length: 7 }, (_, i) => i);

  const renderTimeline = () => (
    <div
      ref={containerRef}
      className="relative flex overflow-auto rounded-lg border border-border/60 bg-card/40"
      style={{ maxHeight: "calc(100vh - 240px)" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Time column */}
      <div className="sticky left-0 z-20 flex flex-col bg-card border-r border-border/60" style={{ minWidth: 52 }}>
        <div className="h-10 border-b border-border/60" />
        {timeLabels.map((label, i) => (
          <div
            key={i}
            className="flex items-start justify-end pr-2 text-[10px] font-medium border-b"
            style={{
              height: slotHeight,
              color: label ? "hsl(var(--foreground))" : "transparent",
              borderColor: label ? "hsl(var(--border) / 0.4)" : "hsl(var(--border) / 0.12)",
            }}
          >
            {label || "."}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {dayColumns.map((colIdx) => {
        const dayIndex = DAY_INDICES[colIdx];
        const dayBlocks = getBlocksForDay(dayIndex);
        const isWeekend = colIdx >= 5;
        return (
          <div
            key={dayIndex}
            className={cn(
              "flex-1 border-r border-border/30 last:border-r-0",
              viewMode === "day" ? "min-w-full" : "min-w-[130px]",
              isWeekend && "bg-secondary/20"
            )}
          >
            {/* Day header */}
            <div className={cn(
              "sticky top-0 z-10 h-10 flex items-center justify-center border-b border-border/60",
              "bg-card/95 backdrop-blur-sm",
              viewMode === "day" ? "text-sm" : "text-xs"
            )}>
              <span className="font-semibold text-foreground">
                {viewMode === "day" ? DAYS_FULL[colIdx] : DAYS[colIdx]}
              </span>
              {dayBlocks.length > 0 && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  ({dayBlocks.length})
                </span>
              )}
            </div>

            {/* Slots */}
            <div className="relative">
              {timeLabels.map((label, i) => (
                <div
                  key={i}
                  className="border-b"
                  style={{
                    height: slotHeight,
                    borderColor: label ? "hsl(var(--border) / 0.3)" : "hsl(var(--border) / 0.08)",
                  }}
                  onClick={() => onSelectBlock(null)}
                />
              ))}

              {/* Blocks */}
              {dayBlocks.map((block) => {
                const startMin = timeToMinutes(block.start_time);
                const endMin = timeToMinutes(block.end_time);
                const top = (startMin / zoom) * slotHeight;
                const height = ((endMin - startMin) / zoom) * slotHeight;
                const layer = layerMap.get(block.layer_id);

                return (
                  <ScheduleBlockCard
                    key={block.id}
                    block={block}
                    layer={layer}
                    isSelected={selectedBlockId === block.id}
                    hasConflict={conflicts.has(block.id)}
                    slotHeight={slotHeight}
                    zoom={zoom}
                    top={top}
                    height={height}
                    onSelect={onSelectBlock}
                    onMouseDown={handleMouseDown}
                    dayIndex={dayIndex}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-y-auto rounded-lg border border-border/60 bg-card/40" style={{ maxHeight: "calc(100vh - 240px)" }}>
      {DAY_INDICES.map((dayIndex, di) => {
        const dayBlocks = getBlocksForDay(dayIndex);
        if (dayBlocks.length === 0) return null;
        return (
          <div key={dayIndex}>
            <div className="sticky top-0 z-10 px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border/60 text-xs font-semibold text-foreground">
              {DAYS_FULL[di]}
              <span className="ml-2 text-muted-foreground font-normal">({dayBlocks.length} bloques)</span>
            </div>
            <div className="divide-y divide-border/30">
              {dayBlocks
                .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
                .map((block) => {
                  const layer = layerMap.get(block.layer_id);
                  const hasConflict = conflicts.has(block.id);
                  return (
                    <button
                      key={block.id}
                      onClick={() => onSelectBlock(block.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-secondary/40",
                        selectedBlockId === block.id && "bg-primary/10"
                      )}
                    >
                      <span
                        className="h-8 w-1 rounded-full shrink-0"
                        style={{ background: layer?.color || "hsl(var(--muted-foreground))" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{block.name || "Sin nombre"}</div>
                        <div className="text-xs text-muted-foreground">
                          {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}
                          {block.playlist?.name && <span> · {block.playlist.name}</span>}
                        </div>
                      </div>
                      {hasConflict && (
                        <span className="text-amber-400 text-[10px] font-medium">Conflicto</span>
                      )}
                      {!block.is_enabled && (
                        <span className="text-muted-foreground text-[10px]">Inactivo</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}
      {filteredBlocks.length === 0 && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          No hay bloques programados.
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col gap-2 min-w-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View switcher */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-8 bg-secondary/40">
            <TabsTrigger value="week" className="text-[11px] gap-1 h-6 px-2.5">
              <CalendarDays className="h-3 w-3" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="day" className="text-[11px] gap-1 h-6 px-2.5">
              <Calendar className="h-3 w-3" />
              Día
            </TabsTrigger>
            <TabsTrigger value="list" className="text-[11px] gap-1 h-6 px-2.5">
              <List className="h-3 w-3" />
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Day picker in day mode */}
        {viewMode === "day" && (
          <div className="flex gap-1">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => setFocusDay(i)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors",
                  focusDay === i
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* Zoom */}
        {viewMode !== "list" && (
          <div className="ml-auto flex items-center gap-1 bg-secondary/40 rounded-lg border border-border/50 px-1.5 py-0.5">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={zoomOut} disabled={zoom === 60}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-[11px] text-muted-foreground w-7 text-center font-medium">{zoom}m</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={zoomIn} disabled={zoom === 15}>
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "list" ? renderListView() : renderTimeline()}
    </div>
  );
};

export default WeeklyCalendarGrid;
