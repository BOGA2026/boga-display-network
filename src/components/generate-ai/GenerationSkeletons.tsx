import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CANVAS_SIZES } from "./types";

export type GenerationStage = "menu" | "generando" | "marca";

export const STAGE_COPY: Record<GenerationStage, string> = {
  menu: "Leyendo tu menú…",
  generando: "Generando propuestas…",
  marca: "Aplicando los colores de tu marca…",
};

interface Props {
  stage: GenerationStage;
  formato: string;
  onCancel: () => void;
  /** How many placeholders to show (3 for a full batch, 1 when retrying a slot). */
  count?: number;
}

/**
 * Honest loading state: three placeholders in the exact shape and aspect ratio
 * of the pieces that are coming, plus the real stage we are in. No fake
 * progress bar — the backend does not report percentages.
 */
export default function GenerationSkeletons({ stage, formato, onCancel, count = 3 }: Props) {
  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="font-medium">{STAGE_COPY[stage]}</span>
          <span className="text-muted-foreground">Suele tardar entre 10 y 30 segundos.</span>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCancel}>
          <X className="h-3.5 w-3.5" /> Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-sidebar-border bg-sidebar">
            <div
              className="w-full animate-pulse bg-muted/40"
              style={{ aspectRatio: `${size.w} / ${size.h}` }}
            />
            <div className="space-y-2 p-4">
              <div className="h-4 w-24 animate-pulse rounded-full bg-muted/40" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted/30" />
              <div className="h-8 w-full animate-pulse rounded-md bg-muted/25" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
