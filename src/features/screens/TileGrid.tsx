import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

const MIN_TILE = 200;
const GAP = 12;
/** Por encima de este número, setenta miniaturas de golpe congelan la página. */
export const VIRTUALIZE_THRESHOLD = 60;

interface Props<T> {
  items: T[];
  keyOf: (item: T) => string;
  render: (item: T) => ReactNode;
}

/**
 * Grilla densa (auto-fill, minmax(200px, 1fr), gap 12px).
 * Con más de 60 tarjetas virtualiza por filas contra el scroll del panel.
 */
export function TileGrid<T>({ items, keyOf, render }: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollEl((el.closest("main") as HTMLElement) ?? null);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const virtualize = items.length > VIRTUALIZE_THRESHOLD;
  const columns = Math.max(1, Math.floor((width + GAP) / (MIN_TILE + GAP))) || 1;
  const tileWidth = columns > 0 ? (width - GAP * (columns - 1)) / columns : MIN_TILE;
  // 16:9 + bloque de identidad (~74 px)
  const rowHeight = Math.round((tileWidth * 9) / 16) + 74 + GAP;
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: virtualize ? rowCount : 0,
    getScrollElement: () => scrollEl,
    estimateSize: () => rowHeight,
    overscan: 3,
  });

  useEffect(() => {
    if (virtualize) virtualizer.measure();
  }, [rowHeight, columns, virtualize, virtualizer]);

  if (!virtualize) {
    return (
      <div
        ref={containerRef}
        className="grid"
        style={{
          gap: GAP,
          gridTemplateColumns: `repeat(auto-fill, minmax(${MIN_TILE}px, 1fr))`,
        }}
      >
        {items.map((item) => (
          <div key={keyOf(item)}>{render(item)}</div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {virtualizer.getVirtualItems().map((row) => {
        const slice = items.slice(row.index * columns, row.index * columns + columns);
        return (
          <div
            key={row.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${row.start}px)`,
              display: "grid",
              gap: GAP,
              paddingBottom: GAP,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {slice.map((item) => (
              <div key={keyOf(item)}>{render(item)}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
