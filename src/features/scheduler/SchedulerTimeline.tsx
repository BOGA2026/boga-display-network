import { useMemo, useRef, useState } from "react";
import { AlertTriangle, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { findConflicts, type ScheduleBlock, type Weekday } from "./resolveScheduleConflicts";

/**
 * Weekly canvas: 7 columns (L–D) × 24 rows (1h each, subdivided into 4 × 15m
 * snap points). Blocks are absolutely positioned per column and support:
 *   - drag: hold the body and move → changes start_time (snaps to 15m)
 *   - resize: grab the bottom edge → changes end_time (snaps to 15m)
 *   - live conflict overlay: pairs that collide get a red glow + tooltip.
 *
 * Kept dependency-free: pointer events + one absolutely positioned overlay
 * per weekday. Animations use CSS transitions so blocks glide back into
 * place when the drop is committed.
 */

const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_MIN = 15;
const HOUR_HEIGHT = 56; // px

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fmt = (n: number) => {
  const h = Math.floor(n / 60).toString().padStart(2, "0");
  const m = (n % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
const snap = (n: number) => Math.round(n / SLOT_MIN) * SLOT_MIN;

export interface SchedulerTimelineProps {
  blocks: ScheduleBlock[];
  playlistNameById: Record<string, string>;
  layerColorById?: Record<string, string>;
  onChange: (next: ScheduleBlock[]) => void;
  onBlockClick?: (block: ScheduleBlock) => void;
}

type Drag =
  | { kind: "move"; id: string; grabOffsetMin: number; pointerId: number }
  | { kind: "resize"; id: string; pointerId: number };

export function SchedulerTimeline({
  blocks,
  playlistNameById,
  layerColorById = {},
  onChange,
  onBlockClick,
}: SchedulerTimelineProps) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const conflicts = useMemo(() => findConflicts(blocks), [blocks]);
  const conflictedIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of conflicts) {
      s.add(c.a.id);
      s.add(c.b.id);
    }
    return s;
  }, [conflicts]);

  const pxFromMin = (m: number) => (m / 60) * HOUR_HEIGHT;
  const minFromPx = (px: number) => (px / HOUR_HEIGHT) * 60;

  const columnFor = (weekday: Weekday) => {
    if (!gridRef.current) return null;
    return gridRef.current.querySelector<HTMLDivElement>(
      `[data-weekday="${weekday}"]`,
    );
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const target = blocks.find((b) => b.id === drag.id);
    if (!target) return;
    const col = columnFor(target.days_of_week[0]);
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const localY = Math.max(0, Math.min(24 * HOUR_HEIGHT, e.clientY - rect.top));
    if (drag.kind === "move") {
      const newStart = snap(minFromPx(localY) - drag.grabOffsetMin);
      const length = toMin(target.end_time) - toMin(target.start_time);
      const start = Math.max(0, Math.min(24 * 60 - length, newStart));
      onChange(
        blocks.map((b) =>
          b.id === target.id ? { ...b, start_time: fmt(start), end_time: fmt(start + length) } : b,
        ),
      );
    } else {
      const startMin = toMin(target.start_time);
      const newEnd = snap(minFromPx(localY));
      const end = Math.max(startMin + SLOT_MIN, Math.min(24 * 60, newEnd));
      onChange(blocks.map((b) => (b.id === target.id ? { ...b, end_time: fmt(end) } : b)));
    }
  };

  const stopDrag = () => setDrag(null);

  return (
    <div className="space-y-3">
      {conflicts.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>{conflicts.length} conflicto{conflicts.length === 1 ? "" : "s"} detectado{conflicts.length === 1 ? "" : "s"}.</strong>{" "}
            Revisa los bloques resaltados en rojo antes de publicar; se aplicará el de mayor prioridad y, si empatan, el más reciente.
          </div>
        </div>
      )}

      <div
        ref={gridRef}
        className="grid select-none rounded-2xl border border-border/60 bg-card/40 backdrop-blur"
        style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      >
        {/* corner */}
        <div className="border-b border-r border-border/40" />
        {DAY_LABELS.map((label, idx) => (
          <div
            key={idx}
            className="border-b border-r border-border/40 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {label}
          </div>
        ))}

        {/* hour rail */}
        <div className="border-r border-border/40 text-xs text-muted-foreground/70">
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex items-start justify-end pr-1"
              style={{ height: HOUR_HEIGHT }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {DAY_LABELS.map((_, day) => (
          <div
            key={day}
            data-weekday={day}
            className="relative border-r border-border/40"
            style={{ height: 24 * HOUR_HEIGHT }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="border-b border-border/25"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}
            {blocks
              .filter((b) => b.days_of_week.includes(day as Weekday))
              .map((b) => {
                const top = pxFromMin(toMin(b.start_time));
                const height = Math.max(24, pxFromMin(toMin(b.end_time) - toMin(b.start_time)));
                const bad = conflictedIds.has(b.id);
                const color = layerColorById[b.layer_id] ?? "hsl(var(--primary))";
                return (
                  <div
                    key={`${b.id}-${day}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlockClick?.(b);
                    }}
                    onPointerDown={(e) => {
                      if ((e.target as HTMLElement).dataset.role === "resize") return;
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const grabOffsetMin = minFromPx(e.clientY - rect.top);
                      setDrag({ kind: "move", id: b.id, grabOffsetMin, pointerId: e.pointerId });
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    className={cn(
                      "group absolute left-1 right-1 cursor-grab overflow-hidden rounded-lg border px-2 py-1 text-xs text-white shadow-lg transition-all duration-200",
                      drag?.id === b.id ? "cursor-grabbing scale-[1.02] shadow-2xl" : "hover:shadow-xl",
                      bad ? "border-destructive ring-2 ring-destructive/60 animate-pulse" : "border-white/10",
                      !b.is_enabled && "opacity-40",
                    )}
                    style={{
                      top,
                      height,
                      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    }}
                    title={`${playlistNameById[b.playlist_id] ?? "Lista"} · ${b.start_time}–${b.end_time}`}
                  >
                    <div className="flex items-center gap-1 font-semibold leading-tight">
                      <GripVertical className="h-3 w-3 opacity-70" />
                      <span className="truncate">{playlistNameById[b.playlist_id] ?? "Lista"}</span>
                    </div>
                    <div className="text-xs opacity-80">
                      {b.start_time}–{b.end_time}
                    </div>
                    <div
                      data-role="resize"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setDrag({ kind: "resize", id: b.id, pointerId: e.pointerId });
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      }}
                      className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize bg-white/0 hover:bg-white/20"
                    />
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
