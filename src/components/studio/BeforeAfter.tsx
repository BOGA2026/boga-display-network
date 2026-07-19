import { useState } from "react";

export type BeforeAfterCase = {
  before: string;
  after: string;
  label: string;
  result?: string;
};

export const STUDIO_CASES: BeforeAfterCase[] = [
  {
    before: "/media/studio/caso1-antes.webp",
    after: "/media/studio/caso1-despues.webp",
    label: "Carta de almuerzos — restaurante piloto en Bogotá",
    // Sin métrica verificada: omitimos la línea de resultado a propósito.
  },
];

export function BeforeAfter({ c }: { c: BeforeAfterCase }) {
  const [pos, setPos] = useState(50);

  return (
    <figure
      className="ba-wrap"
      aria-label={`Antes y después: ${c.label}`}
    >
      <div className="ba-frame relative overflow-hidden rounded-2xl border border-border/40 bg-black">
        <img
          src={c.before}
          alt={`Antes: ${c.label}`}
          loading="lazy"
          className="block h-auto w-full select-none"
          draggable={false}
        />
        <img
          src={c.after}
          alt={`Después: ${c.label}`}
          loading="lazy"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        />

        {/* Línea divisoria visual */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-px bg-white/80 mix-blend-screen"
          style={{ left: `${pos}%` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur"
          style={{ left: `${pos}%` }}
        >
          ‹ ›
        </div>

        {/* Etiquetas antes/después */}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
          Antes
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-primary/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground backdrop-blur">
          Después
        </span>

        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(+e.target.value)}
          aria-label="Comparar antes y después"
          className="ba-slider absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <figcaption className="mt-4 text-sm text-muted-foreground">
        {c.label}
        {c.result && (
          <>
            {" "}
            · <strong className="text-foreground">{c.result}</strong>
          </>
        )}
      </figcaption>
    </figure>
  );
}
