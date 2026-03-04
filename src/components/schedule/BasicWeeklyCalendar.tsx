import { useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, GripHorizontal, HelpCircle } from "lucide-react";
import PlaylistHelpTooltip, { getPreference as getHelpDismissed } from "./PlaylistHelpTooltip";
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
import { toast } from "@/hooks/use-toast";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

const SNAP_MINUTES = 15;
const MIN_DURATION = 15;
const SLOT_HEIGHT = 56;
const ZOOM = 60; // 1 slot = 60 min

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function snapTo15(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

interface DragState {
  blockId: string;
  mode: "move" | "resize-start" | "resize-end";
  startY: number;
  origStart: number;
  origEnd: number;
  dayIdx: number;
  currentStart: number;
  currentEnd: number;
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
  const totalSlots = 24;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);

  // Help tooltip state
  const [helpAnchorRect, setHelpAnchorRect] = useState<DOMRect | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const helpTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleBlockMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging || getHelpDismissed()) return;
    clearTimeout(helpTimerRef.current);
    const el = e.currentTarget;
    helpTimerRef.current = setTimeout(() => {
      setHelpAnchorRect(el.getBoundingClientRect());
      setHelpVisible(true);
    }, 300);
  }, [dragging]);

  const handleBlockMouseLeave = useCallback(() => {
    clearTimeout(helpTimerRef.current);
    setHelpVisible(false);
  }, []);

  const handleHelpClose = useCallback(() => {
    setHelpVisible(false);
  }, []);

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

  // Get the live start/end for a block (use drag state if dragging that block)
  const getLiveTimes = useCallback(
    (block: ScheduleBlock) => {
      if (dragging && dragging.blockId === block.id) {
        return { start: dragging.currentStart, end: dragging.currentEnd };
      }
      return { start: timeToMinutes(block.start_time), end: timeToMinutes(block.end_time) };
    },
    [dragging]
  );

  const handleMouseDown = (
    e: React.MouseEvent,
    blockId: string,
    mode: "move" | "resize-start" | "resize-end",
    dayIdx: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    // Hide help tooltip on drag start
    if (helpVisible) {
      setHelpVisible(false);
      clearTimeout(helpTimerRef.current);
    }
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const origStart = timeToMinutes(block.start_time);
    const origEnd = timeToMinutes(block.end_time);
    setDragging({
      blockId,
      mode,
      startY: e.clientY,
      origStart,
      origEnd,
      dayIdx,
      currentStart: origStart,
      currentEnd: origEnd,
    });
    onSelectBlock(blockId);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dy = e.clientY - dragging.startY;
      const minuteDelta = (dy / SLOT_HEIGHT) * ZOOM;

      let newStart = dragging.origStart;
      let newEnd = dragging.origEnd;

      if (dragging.mode === "move") {
        const dur = dragging.origEnd - dragging.origStart;
        newStart = snapTo15(Math.max(0, Math.min(24 * 60 - dur, dragging.origStart + minuteDelta)));
        newEnd = newStart + dur;
      } else if (dragging.mode === "resize-end") {
        newEnd = snapTo15(Math.max(dragging.origStart + MIN_DURATION, Math.min(24 * 60, dragging.origEnd + minuteDelta)));
        newStart = dragging.origStart;
      } else if (dragging.mode === "resize-start") {
        newStart = snapTo15(Math.max(0, Math.min(dragging.origEnd - MIN_DURATION, dragging.origStart + minuteDelta)));
        newEnd = dragging.origEnd;
      }

      setDragging((prev) => prev ? { ...prev, currentStart: newStart, currentEnd: newEnd } : null);
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;
    const { blockId, currentStart, currentEnd, origStart, origEnd, dayIdx } = dragging;

    if (currentStart !== origStart || currentEnd !== origEnd) {
      onMoveBlock(blockId, minutesToTime(currentStart), minutesToTime(currentEnd), dayIdx);
      toast({ title: "✓ Duración actualizada" });
    }

    setDragging(null);
  }, [dragging, onMoveBlock]);

  return (
    <div
      ref={containerRef}
      className="relative flex overflow-auto rounded-2xl border border-border/50 bg-card/40 select-none"
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
            style={{ height: SLOT_HEIGHT }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {DAY_INDICES.map((dayIndex, di) => {
        const dayBlocks = getBlocksForDay(dayIndex);
        const isWeekend = di >= 5;
        const isDraggingInDay = dragging?.dayIdx === dayIndex;

        return (
          <div
            key={dayIndex}
            className={cn(
              "flex-1 min-w-[140px] border-r border-border/30 last:border-r-0 transition-colors duration-200",
              isWeekend && "bg-secondary/10",
              isDraggingInDay && "bg-primary/5"
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
                  style={{ height: SLOT_HEIGHT }}
                  onClick={() => onSelectBlock(null)}
                />
              ))}

              {/* Blocks */}
              {dayBlocks.map((block) => {
                const { start: startMin, end: endMin } = getLiveTimes(block);
                const top = (startMin / ZOOM) * SLOT_HEIGHT;
                const height = ((endMin - startMin) / ZOOM) * SLOT_HEIGHT;
                const layer = layerMap.get(block.layer_id);
                const color = layer?.color || "#8A00FF";
                const isSelected = selectedBlockId === block.id;
                const hasConflict = conflicts.has(block.id);
                const isDraggingThis = dragging?.blockId === block.id;

                return (
                  <div
                    key={block.id}
                    className={cn(
                      "absolute left-1.5 right-1.5 rounded-xl cursor-grab transition-shadow overflow-hidden group border-2",
                      isDraggingThis && "cursor-grabbing shadow-2xl z-50 ring-2 ring-primary/40",
                      isSelected && !isDraggingThis
                        ? "border-primary shadow-xl ring-2 ring-primary/30 scale-[1.02]"
                        : !isDraggingThis && "border-transparent hover:border-foreground/15 hover:shadow-lg",
                      hasConflict && "ring-2 ring-amber-400/50"
                    )}
                    style={{
                      top,
                      height: Math.max(height, SLOT_HEIGHT * 0.8),
                      background: `linear-gradient(145deg, ${color}cc, ${color}88)`,
                      borderLeftWidth: 4,
                      borderLeftColor: color,
                      zIndex: isDraggingThis ? 50 : (layer?.priority || 0) + 5,
                      transition: isDraggingThis ? "none" : "top 0.15s ease, height 0.15s ease, box-shadow 0.2s ease",
                    }}
                    onMouseDown={(e) => handleMouseDown(e, block.id, "move", dayIndex)}
                    onMouseEnter={handleBlockMouseEnter}
                    onMouseLeave={handleBlockMouseLeave}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBlock(block.id);
                    }}
                  >
                    {/* Top resize handle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute top-0 left-0 right-0 h-4 cursor-n-resize z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, block.id, "resize-start", dayIndex);
                          }}
                        >
                          <GripHorizontal className="h-3 w-3 text-white/80" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Arrastra para cambiar la hora de inicio
                      </TooltipContent>
                    </Tooltip>

                    {/* Content */}
                    <div className="px-3 py-2 mt-1">
                      <div className="text-sm font-bold text-white truncate drop-shadow-sm">
                        {block.playlist?.name || block.name || "Sin nombre"}
                      </div>
                      {/* Live time display (always visible during drag, otherwise on taller blocks) */}
                      {(isDraggingThis || height > SLOT_HEIGHT * 0.9) && (
                        <div className={cn(
                          "text-xs mt-1 font-mono font-semibold flex items-center gap-1",
                          isDraggingThis ? "text-white bg-black/40 rounded-md px-1.5 py-0.5 inline-flex" : "text-white/80"
                        )}>
                          {minutesToTime(startMin)} – {minutesToTime(endMin)}
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

                    {/* Bottom resize handle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute bottom-0 left-0 right-0 h-4 cursor-s-resize z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl"
                          style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, block.id, "resize-end", dayIndex);
                          }}
                        >
                          <GripHorizontal className="h-3 w-3 text-white/80" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Arrastra para cambiar la hora de fin
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Help tooltip */}
      <PlaylistHelpTooltip
        anchorRect={helpAnchorRect}
        visible={helpVisible}
        onClose={handleHelpClose}
      />

      {/* Drag hint overlay */}
      {dragging && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-full bg-card/95 backdrop-blur-xl border border-border/60 shadow-xl px-4 py-2">
            <span className="text-xs font-semibold text-foreground">
              Arrastra el borde para extender
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicWeeklyCalendar;
