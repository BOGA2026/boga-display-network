import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";

interface Props {
  block: ScheduleBlock;
  layer: ScheduleLayer | undefined;
  isSelected: boolean;
  hasConflict: boolean;
  slotHeight: number;
  zoom: number;
  top: number;
  height: number;
  onSelect: (id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string, mode: "move" | "resize-end", dayIndex: number) => void;
  dayIndex: number;
}

const ScheduleBlockCard = ({
  block,
  layer,
  isSelected,
  hasConflict,
  slotHeight,
  top,
  height,
  onSelect,
  onMouseDown,
  dayIndex,
}: Props) => {
  const color = layer?.color || "#8A00FF";
  const priority = layer?.priority || 0;

  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-lg cursor-pointer transition-all overflow-hidden group border",
        isSelected
          ? "ring-2 ring-primary/60 border-primary/40 shadow-lg"
          : "border-transparent hover:border-foreground/10",
        hasConflict && "ring-1 ring-amber-400/50"
      )}
      style={{
        top,
        height: Math.max(height, slotHeight),
        background: `linear-gradient(135deg, ${color}dd, ${color}99)`,
        borderLeftWidth: 3,
        borderLeftColor: color,
        zIndex: priority + 5,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, block.id, "move", dayIndex);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
    >
      {/* Content */}
      <div className="px-2 py-1">
        <div className="text-[11px] font-semibold text-white truncate leading-tight drop-shadow-sm">
          {block.playlist?.name || block.name || "Sin nombre"}
        </div>
        {height > slotHeight * 1.3 && (
          <div className="text-[10px] text-white/80 mt-0.5 font-medium">
            {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}
          </div>
        )}
        {priority > 0 && height > slotHeight * 2 && (
          <div className="mt-1">
            <span className="inline-block rounded-full text-[9px] px-1.5 py-px bg-black/30 text-white/90 font-medium">
              Override P{priority}
            </span>
          </div>
        )}
      </div>

      {/* Conflict indicator */}
      {hasConflict && (
        <div className="absolute top-1 right-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-300 drop-shadow" />
        </div>
      )}

      {/* Disabled overlay */}
      {!block.is_enabled && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground font-medium">Inactivo</span>
        </div>
      )}

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2.5 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(to top, ${color}, transparent)` }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, block.id, "resize-end", dayIndex);
        }}
      />
    </div>
  );
};

export default ScheduleBlockCard;
