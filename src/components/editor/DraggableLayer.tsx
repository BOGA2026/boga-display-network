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
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  children: React.ReactNode;
};

export function DraggableLayer({
  id, x, y, w, h, selected, zoom, editing, onSelect, onDoubleClick, onMove, onResize, children,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef<{ mx: number; my: number; x: number; y: number; w: number; h: number } | null>(null);
  const scale = zoom / 100;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (editing) return; // don't drag while editing text
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(id);
    setDragging(true);
    startRef.current = { mx: e.clientX, my: e.clientY, x, y, w, h };
  }, [id, x, y, w, h, onSelect, editing]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = (e.clientX - startRef.current.mx) / scale;
    const dy = (e.clientY - startRef.current.my) / scale;
    if (dragging) {
      onMove(id, Math.round(startRef.current.x + dx), Math.round(startRef.current.y + dy));
    }
    if (resizing) {
      onResize(id, Math.max(40, Math.round(startRef.current.w + dx)), Math.max(40, Math.round(startRef.current.h + dy)));
    }
  }, [dragging, resizing, id, scale, onMove, onResize]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    setResizing(false);
    startRef.current = null;
  }, []);

  const onResizeDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(id);
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
      className={`absolute select-none ${
        selected ? "ring-2 ring-primary ring-offset-1" : ""
      }`}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        cursor: editing ? "text" : dragging ? "grabbing" : "grab",
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
