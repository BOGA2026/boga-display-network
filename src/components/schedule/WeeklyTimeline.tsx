import { useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";
import { AlertTriangle } from "lucide-react";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 .. Sun=0

interface Props {
  blocks: ScheduleBlock[];
  layers: ScheduleLayer[];
  filterLayerId: string | null;
  zoom: number; // minutes per slot: 15, 30, 60
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onMoveBlock: (id: string, newStart: string, newEnd: string, dayIndex: number) => void;
  conflicts: Map<string, string[]>;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const WeeklyTimeline = ({
  blocks,
  layers,
  filterLayerId,
  zoom,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  conflicts,
}: Props) => {
  const slotsPerHour = 60 / zoom;
  const totalSlots = 24 * slotsPerHour;
  const slotHeight = zoom === 15 ? 16 : zoom === 30 ? 24 : 40;
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
    let b = blocks.filter((bl) => bl.is_enabled);
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
        const newStart = Math.max(0, Math.min(24 * 60 - (dragging.origEnd - dragging.origStart), dragging.origStart + minuteDelta));
        const duration = dragging.origEnd - dragging.origStart;
        onMoveBlock(dragging.blockId, minutesToTime(newStart), minutesToTime(newStart + duration), dragging.dayIdx);
      } else {
        const newEnd = Math.max(dragging.origStart + zoom, Math.min(24 * 60, dragging.origEnd + minuteDelta));
        onMoveBlock(dragging.blockId, minutesToTime(dragging.origStart), minutesToTime(newEnd), dragging.dayIdx);
      }
    },
    [dragging, slotHeight, zoom, onMoveBlock]
  );

  const handleMouseUp = () => setDragging(null);

  return (
    <div
      ref={containerRef}
      className="relative flex overflow-auto rounded-lg border border-border bg-card"
      style={{ maxHeight: "calc(100vh - 280px)" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Time column */}
      <div className="sticky left-0 z-20 flex flex-col bg-card border-r border-border" style={{ minWidth: 56 }}>
        <div className="h-10 border-b border-border" /> {/* header spacer */}
        {timeLabels.map((label, i) => (
          <div
            key={i}
            className="flex items-start justify-end pr-2 text-[10px] text-muted-foreground border-b border-border/30"
            style={{ height: slotHeight }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {DAY_INDICES.map((dayIndex, di) => {
        const dayBlocks = getBlocksForDay(dayIndex);
        return (
          <div key={dayIndex} className="flex-1 min-w-[120px] border-r border-border/50 last:border-r-0">
            {/* Day header */}
            <div className="sticky top-0 z-10 h-10 flex items-center justify-center bg-card border-b border-border text-xs font-semibold text-foreground">
              {DAYS[di]}
            </div>
            {/* Slots */}
            <div className="relative">
              {timeLabels.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-b",
                    i * zoom % 60 === 0 ? "border-border/40" : "border-border/15"
                  )}
                  style={{ height: slotHeight }}
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
                const color = layer?.color || "#8A00FF";
                const isSelected = selectedBlockId === block.id;
                const hasConflict = conflicts.has(block.id);

                return (
                  <div
                    key={block.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md cursor-pointer transition-all overflow-hidden group",
                      isSelected && "ring-2 ring-foreground/50"
                    )}
                    style={{
                      top,
                      height: Math.max(height, slotHeight),
                      background: `${color}cc`,
                      borderLeft: `3px solid ${color}`,
                      zIndex: (layer?.priority || 0) + 5,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, block.id, "move", dayIndex)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBlock(block.id);
                    }}
                  >
                    <div className="px-1.5 py-0.5 text-[10px] text-white font-medium truncate leading-tight">
                      {block.playlist?.name || block.name || "Sin nombre"}
                    </div>
                    {height > slotHeight * 1.5 && (
                      <div className="px-1.5 text-[9px] text-white/70">
                        {block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}
                      </div>
                    )}
                    {(layer?.priority || 0) > 0 && height > slotHeight * 2 && (
                      <div className="px-1.5">
                        <span className="inline-block rounded text-[8px] px-1 py-px bg-black/30 text-white/90">
                          Override
                        </span>
                      </div>
                    )}
                    {hasConflict && (
                      <div className="absolute top-0.5 right-0.5">
                        <AlertTriangle className="h-3 w-3 text-yellow-400" />
                      </div>
                    )}
                    {/* Resize handle */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 bg-white/20"
                      onMouseDown={(e) => handleMouseDown(e, block.id, "resize-end", dayIndex)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyTimeline;
