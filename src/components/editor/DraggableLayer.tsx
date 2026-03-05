import React, { useRef, useState, useCallback } from "react";

type Props = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
  zoom: number;
  editing: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onDoubleClick: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onMoveEnd?: () => void;
  onResize: (id: string, w: number, h: number) => void;
  onDragEnd?: () => void;
  children: React.ReactNode;
};

export function DraggableLayer({
  id, x, y, w, h, selected, zoom, editing, onSelect, onDoubleClick, onMove, onMoveEnd, onResize, onDragEnd, children,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef<{ mx: number; my: number; x: number; y: number; w: number; h: number } | null>(null);
  const scale = zoom / 100;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (editing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const additive = e.ctrlKey || e.metaKey || e.shiftKey;
    onSelect(id, additive);
    setDragging(true);
    startRef.current = { mx: e.clientX, my: e.clientY, x, y, w, h };
  }, [id, x, y, w, h, onSelect, editing]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = (e.clientX - startRef.current.mx) / scale;
    const dy = (e.clientY - startRef.current.my) / scale;
    if (dragging) {
      // Send delta for multi-drag support
      onMove(id, Math.round(dx), Math.round(dy));
      // Update start so deltas are incremental
      startRef.current.mx = e.clientX;
      startRef.current.my = e.clientY;
    }
    if (resizing) {
      const totalDx = (e.clientX - startRef.current.mx + (startRef.current.w - w) * scale) / scale;
      onResize(id, Math.max(40, Math.round(startRef.current.w + (e.clientX - startRef.current.mx) / scale)), Math.max(40, Math.round(startRef.current.h + (e.clientY - startRef.current.my) / scale)));
    }
  }, [dragging, resizing, id, scale, onMove, onResize, w]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const wasDragging = dragging;
    setDragging(false);
    setResizing(false);
    startRef.current = null;
    if (wasDragging) {
      onDragEnd?.();
      onMoveEnd?.();
    }
  }, [dragging, onDragEnd, onMoveEnd]);

  const onResizeDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(id, false);
    setResizing(true);
    startRef.current = { mx: e.clientX, my: e.clientY, x, y, w, h };
  }, [id, x, y, w, h, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(id);
  }, [id, onDoubleClick]);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={handleDoubleClick}
      className="absolute select-none"
      data-selected={selected || undefined}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        cursor: editing ? "text" : dragging ? "grabbing" : "grab",
        border: selected ? "2px solid #22d3ee" : "1px dashed transparent",
        boxShadow: selected ? "0 0 0 3px rgba(34, 211, 238, 0.35)" : "none",
      }}
    >
      {children}
      {selected && !editing && (
        <div
          onPointerDown={onResizeDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-sm border border-primary bg-primary-foreground cursor-se-resize"
        />
      )}
    </div>
  );
}
