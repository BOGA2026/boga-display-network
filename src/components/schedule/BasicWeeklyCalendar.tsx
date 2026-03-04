import { useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, GripVertical } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

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
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onMoveBlock: (id: string, newStart: string, newEnd: string, dayIndex: number) => void;
  onDeleteBlock: (id: string) => void;
  conflicts: Map<string, string[]>;
}

const BasicWeeklyCalendar = ({
  blocks,
  layers,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onDeleteBlock,
  conflicts,
}: Props) => {
  // Fixed zoom for simplicity: 1 hour slots
  const zoom = 60;
  const slotHeight = 56;
  const totalSlots = 24;
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState<{
    blockId: string;
    mode: "move" | "resize-end";
    startY: number;
    origStart: number;
    origEnd: number;
    dayIdx: number;
  } | null>(null);

  const getBlocksForDay = useCallback(
    (dayIndex: number) => blocks.filter((b) => b.days_of_week.includes(dayIndex) && b.is_enabled),
    [blocks]
  );

  const layerMap = useMemo(() => {
    const m = new Map<string, ScheduleLayer>();
    layers.forEach((l) => m.set(l.id, l));
    return m;
  }, [layers]);

  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < totalSlots; i++) {
      labels.push(`${String(i).padStart(2, "0")}:00`);
    }
    return labels;
  }, []);

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

  return (
    <div
      ref={containerRef}
      className="relative flex overflow-auto rounded-2xl border border-border/50 bg-card/40"
      style={{ maxHeight: "calc(100vh - 320px)" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Time column */}
      <div className="sticky left-0 z-20 flex flex-col bg-card/95 backdrop-blur-sm border-r border-border/50" style={{ minWidth: 64 }}>
        <div className="h-12 border-b border-border/50" />
        {timeLabels.map((label, i) => (
          <div
            key={i}
            className="flex items-start justify-end pr-3 text-xs font-medium text-muted-foreground border-b border-border/20"
            style={{ height: slotHeight }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {DAY_INDICES.map((dayIndex, di) => {
        const dayBlocks = getBlocksForDay(dayIndex);
        const isWeekend = di >= 5;

        return (
          <div
            key={dayIndex}
            className={cn(
              "flex-1 min-w-[140px] border-r border-border/30 last:border-r-0",
              isWeekend && "bg-secondary/10"
            )}
          >
            {/* Day header */}
            <div className="sticky top-0 z-10 h-12 flex flex-col items-center justify-center bg-card/95 backdrop-blur-sm border-b border-border/50">
              <span className="text-sm font-bold text-foreground">{DAYS[di]}</span>
              <span className="text-[10px] text-muted-foreground">
                {dayBlocks.length > 0 ? `${dayBlocks.length} contenido${dayBlocks.length > 1 ? "s" : ""}` : "Vacío"}
              </span>
            </div>

            {/* Hour slots */}
            <div className="relative">
              {timeLabels.map((_, i) => (
                <div
                  key={i}
                  className="border-b border-border/15"
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
                      "absolute left-1.5 right-1.5 rounded-xl cursor-pointer transition-all overflow-hidden group border-2",
                      isSelected
                        ? "border-primary shadow-xl ring-2 ring-primary/30 scale-[1.02]"
                        : "border-transparent hover:border-foreground/15 hover:shadow-lg",
                      hasConflict && "ring-2 ring-amber-400/50"
                    )}
                    style={{
                      top,
                      height: Math.max(height, slotHeight * 0.8),
                      background: `linear-gradient(145deg, ${color}cc, ${color}88)`,
                      borderLeftWidth: 4,
                      borderLeftColor: color,
                      zIndex: (layer?.priority || 0) + 5,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, block.id, "move", dayIndex)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBlock(block.id);
                    }}
                  >
                    {/* Drag indicator */}
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-60 transition-opacity">
                      <GripVertical className="h-3.5 w-3.5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="px-3 py-2">
                      <div className="text-sm font-bold text-white truncate drop-shadow-sm">
                        {block.playlist?.name || block.name || "Sin nombre"}
                      </div>
                      {height > slotHeight * 0.9 && (
                        <div className="text-xs text-white/80 mt-1 font-medium">
                          {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}
                        </div>
                      )}
                    </div>

                    {/* Conflict icon */}
                    {hasConflict && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute top-1.5 right-1.5">
                            <AlertTriangle className="h-4 w-4 text-amber-300 drop-shadow" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Este contenido se cruza con otro en el mismo horario</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Delete button on hover */}
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!hasConflict && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="h-7 w-7 rounded-lg bg-black/40 hover:bg-destructive flex items-center justify-center transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-white" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar este contenido?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará "{block.name || "Sin nombre"}" de la programación. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteBlock(block.id)}>
                                Sí, eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>

                    {/* Resize handle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl"
                          style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, block.id, "resize-end", dayIndex);
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Arrastra para cambiar la duración</p>
                      </TooltipContent>
                    </Tooltip>
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

export default BasicWeeklyCalendar;
