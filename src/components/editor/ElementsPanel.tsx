import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_ELEMENTS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  searchElements,
  suggestedElements,
  type CategoryId,
  type ElementDef,
} from "@/features/editor/elements/catalog";
import { toDataUri, type ElementColors } from "@/features/editor/elements/svg";

export type ElementInsertPayload = {
  url: string;
  name: string;
  width: number;
  height: number;
  /** Texto editable que debe insertarse como capa de texto encima (insignias). */
  text?: string;
  textSize?: number;
};

interface Props {
  colors: ElementColors;
  /** Categoría del negocio (Ajustes) para "Sugeridos para ti". */
  businessCategory?: string | null;
  onInsert: (payload: ElementInsertPayload) => void;
}

export default function ElementsPanel({ colors, businessCategory, onInsert }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("sugeridos");

  const all = useMemo(() => ALL_ELEMENTS(), []);
  const suggested = useMemo(() => suggestedElements(all, businessCategory), [all, businessCategory]);

  const visible = useMemo(() => {
    if (query.trim()) return searchElements([...suggested, ...all], query).slice(0, 120);
    if (category === "sugeridos") return suggested;
    return all.filter((e) => e.category === category);
  }, [all, suggested, query, category]);

  const insert = (el: ElementDef) => {
    const url = toDataUri(el.svg(colors), colors);
    onInsert({
      url,
      name: el.label,
      width: el.size[0],
      height: el.size[1],
      text: el.text,
      textSize: el.textSize,
    });
  };

  return (
    <div className="flex h-[520px] w-[380px] flex-col rounded-lg border border-border bg-card shadow-lg">
      <div className="border-b border-border p-3">
        <p className="mb-2 text-sm font-semibold text-foreground">Elementos</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: gaseosa, domicilio, 2x1…"
            className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-8 text-sm outline-none focus:border-primary/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!query && (
        <div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2">
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No encontramos nada con “{query}”. Prueba con “hamburguesa”, “domicilio” o “promo”.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {visible.map((el) => (
              <button
                key={el.id}
                onClick={() => insert(el)}
                title={el.label}
                className="group flex aspect-square items-center justify-center rounded-md border border-border bg-background p-1.5 transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <img
                  src={toDataUri(el.svg(colors), colors)}
                  alt={el.label}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          Todos los elementos toman el color de acento de Tu marca al insertarse.
        </p>
      </div>
    </div>
  );
}
