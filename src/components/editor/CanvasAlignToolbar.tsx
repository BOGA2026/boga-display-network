import React from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignEndVertical,
} from "lucide-react";

type Props = {
  canvasW: number;
  canvasH: number;
  layerX: number;
  layerY: number;
  layerW: number;
  layerH: number;
  onMove: (x: number, y: number) => void;
};

export function CanvasAlignToolbar({ canvasW, canvasH, layerX, layerY, layerW, layerH, onMove }: Props) {
  const btn = "rounded border border-border bg-card px-2 py-1.5 hover:bg-accent text-xs flex items-center gap-1";
  return (
    <div className="flex flex-wrap gap-1.5">
      <button className={btn} onClick={() => onMove(0, layerY)} title="Izquierda">
        <AlignStartVertical className="h-3.5 w-3.5" />
      </button>
      <button className={btn} onClick={() => onMove(Math.round((canvasW - layerW) / 2), layerY)} title="Centro H">
        <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />
      </button>
      <button className={btn} onClick={() => onMove(canvasW - layerW, layerY)} title="Derecha">
        <AlignEndVertical className="h-3.5 w-3.5" />
      </button>
      <button className={btn} onClick={() => onMove(layerX, Math.round((canvasH - layerH) / 2))} title="Centro V">
        <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
      </button>
      <button
        className={btn}
        onClick={() => onMove(Math.round((canvasW - layerW) / 2), Math.round((canvasH - layerH) / 2))}
        title="Centro Total"
      >
        <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />
        <span>Centro</span>
      </button>
    </div>
  );
}
