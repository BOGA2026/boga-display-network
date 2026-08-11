import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/states";
import { LayoutTemplate, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { listTemplates } from "./api";
import {
  BUSINESS_TYPES,
  ORIENTATIONS,
  PIECE_TYPES,
  labelOf,
  type TemplateRow,
} from "./types";

/** Chips de filtro: una sola fila, sin menús desplegables. */
function Chips({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-full border border-border/50 px-3 py-1 text-xs transition-colors",
            value === o.value
              ? "border-primary/60 bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Catálogo de plantillas para el cliente. Elegir una no la modifica: se copia
 * al editor como pieza nueva con el fondo bloqueado.
 */
export default function TemplatesGallery() {
  const navigate = useNavigate();

  /** Arrancamos en la orientación que tienen sus pantallas, no en horizontal por defecto. */
  const { data: orientacionSugerida } = useQuery({
    queryKey: ["orientacion-pantallas"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("screens")
        .select("rotation")
        .is("deleted_at", null)
        .limit(200);
      const verticales = (data ?? []).filter((s) => s.rotation === 90 || s.rotation === 270).length;
      const total = data?.length ?? 0;
      return total > 0 && verticales > total / 2 ? "vertical" : "horizontal";
    },
  });

  const [negocio, setNegocio] = useState("todos");
  const [pieza, setPieza] = useState("todos");
  const [orientacion, setOrientacion] = useState<string | null>(null);
  const orientacionActiva = orientacion ?? orientacionSugerida ?? "horizontal";

  const filtros = useMemo(
    () => ({ businessType: negocio, pieceType: pieza, orientation: orientacionActiva }),
    [negocio, pieza, orientacionActiva],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["plantillas", filtros],
    queryFn: () => listTemplates(filtros),
    staleTime: 60_000,
  });

  const usar = (t: TemplateRow) => navigate(`/dashboard/editor?template=${t.id}`);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Chips
          value={negocio}
          onChange={setNegocio}
          options={[{ value: "todos", label: "Todos los negocios" }, ...BUSINESS_TYPES]}
        />
        <Chips
          value={pieza}
          onChange={setPieza}
          options={[{ value: "todos", label: "Todas las piezas" }, ...PIECE_TYPES]}
        />
        <Chips value={orientacionActiva} onChange={setOrientacion} options={ORIENTATIONS} />
      </div>

      {isLoading ? (
        <div className="v-media-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No pudimos cargar las plantillas"
          description="Recargá la página en un momento."
        />
      ) : !data?.length ? (
        <EmptyState
          icon={LayoutTemplate}
          title="Todavía no hay plantillas para este filtro"
          description="Probá con otro tipo de negocio, otra pieza u otra orientación."
        />
      ) : (
        <div className="v-media-grid">
          {data.map((t) => (
            <button
              key={t.id}
              onClick={() => usar(t)}
              className="v-card v-card-interactive group overflow-hidden p-0 text-left"
            >
              <div
                className={cn(
                  "relative w-full overflow-hidden bg-black/60",
                  t.orientation === "vertical" ? "aspect-[9/16]" : "aspect-video",
                )}
              >
                <img
                  src={t.thumbnail_url || t.background_url}
                  alt={t.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                  {labelOf(ORIENTATIONS, t.orientation)}
                </span>
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-semibold">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {labelOf(BUSINESS_TYPES, t.business_type)} · {labelOf(PIECE_TYPES, t.piece_type)}
                </p>
                <span className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary">
                  <MonitorSmartphone className="h-3.5 w-3.5" /> Usar esta plantilla
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Al elegir una plantilla creamos una copia para vos. El diseño original nunca se modifica.
      </p>
    </div>
  );
}
