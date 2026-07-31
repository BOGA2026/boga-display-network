import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Maximize2, RotateCcw, Pencil, Check, X } from "lucide-react";
import type { Proposal } from "./types";
import { CANVAS_SIZES } from "./types";
import { tvTypography, clampMenuSections } from "@/lib/tvLegibility";
import { ARCHETYPES, type ArchetypeId } from "@/lib/designArchetypes";

interface Props {
  propuestas: Proposal[];
  formato: string;
  onSelect: (p: Proposal) => void;
  onRegenerate: () => void;
  loading: boolean;
  /** Archetypes the backend failed to deliver — rendered as retryable error cards. */
  fallidos?: ArchetypeId[];
  /** Archetype currently being retried (shows a skeleton in its slot). */
  retryTarget?: ArchetypeId | null;
  onRetryArchetype?: (a: ArchetypeId) => void;
}


const archetypeOf = (p: Proposal): ArchetypeId =>
  p.arquetipo && ARCHETYPES[p.arquetipo] ? p.arquetipo : "lista_limpia";

/**
 * Renders a proposal at the exact aspect ratio of the target screen.
 * Everything inside is expressed in canvas pixels and scaled with a single
 * transform, so a 280px thumbnail and a fullscreen preview are pixel-identical.
 */
function Piece({ p, formato, width }: { p: Proposal; formato: string; width: number }) {
  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];
  const scale = width / size.w;
  const t = tvTypography(size.h, size.w);
  const px = (v: number) => v; // canvas-space sizes; the wrapper scales them

  const itemsOf = (max: number) =>
    clampMenuSections(p.secciones ?? [], t.maxDescChars, max).flatMap((s) =>
      (s.items ?? []).map((i) => ({ ...i, seccion: s.nombre })),
    );

  const Header = ({ align = "center" }: { align?: "center" | "left" }) => (
    <div style={{ textAlign: align }}>
      <p
        className="font-bold uppercase leading-none"
        style={{ fontFamily: p.fuente_titulo, fontSize: px(Math.max(p.header?.size ?? 0, t.restaurante)) }}
      >
        {p.header?.nombre_restaurante || p.texto_principal}
      </p>
      {(p.header?.tagline || p.texto_secundario) && (
        <p className="mt-1 truncate" style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.tagline), color: p.color_acento }}>
          {p.header?.tagline || p.texto_secundario}
        </p>
      )}
    </div>
  );

  const DishRow = ({ item, showDesc = true }: { item: any; showDesc?: boolean }) => (
    <div className="space-y-[1%]">
      <div className="flex items-start justify-between gap-2">
        <span className="truncate font-bold" style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.plato) }}>
          {item.plato}
        </span>
        <span className="shrink-0 font-extrabold" style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.precio), color: p.color_acento }}>
          {item.precio}
        </span>
      </div>
      {showDesc && item.descripcion && (
        <p className="line-clamp-2 opacity-80" style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.descripcion) }}>
          {item.descripcion}
        </p>
      )}
    </div>
  );

  const hasMenu = (p.secciones?.length ?? 0) > 0;
  const archetype = ARCHETYPES[archetypeOf(p)];

  let content: JSX.Element;

  if (!hasMenu) {
    const textAlign = p.layout === "izquierda" ? "left" : p.layout === "derecha" ? "right" : "center";
    content = (
      <>
        {p.image_url && (
          <img src={p.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: p.overlay_color || "#000", opacity: p.overlay_opacity ?? 0.55 }} />
        <div className="absolute inset-0 flex flex-col justify-center p-[10%]" style={{ textAlign }}>
          <p className="font-bold leading-tight" style={{ fontFamily: p.fuente_titulo, fontSize: p.titulo_size ?? 84, color: p.color_texto, fontWeight: 800 }}>
            {p.texto_principal}
          </p>
          <p className="leading-snug opacity-85" style={{ fontFamily: p.fuente_cuerpo, fontSize: p.subtitulo_size ?? 28, color: p.color_texto, fontWeight: 300, marginTop: 8 }}>
            {p.texto_secundario}
          </p>
        </div>
      </>
    );
  } else if (archetype.id === "foto_protagonista") {
    const items = itemsOf(ARCHETYPES.foto_protagonista.maxItems);
    content = (
      <>
        {p.image_url && (
          <img src={p.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: p.overlay_color || "#000", opacity: p.overlay_opacity ?? 0.6 }} />
        <div className="absolute inset-x-0 top-0 p-[5%]" style={{ color: p.color_texto }}>
          <Header />
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-[3%] p-[5%]" style={{ backgroundColor: p.background_color, color: p.color_texto }}>
          {items.map((item) => (
            <DishRow key={item.plato} item={item} showDesc={items.length <= 2} />
          ))}
        </div>
      </>
    );
  } else if (archetype.id === "dividido") {
    const items = itemsOf(ARCHETYPES.dividido.maxItems);
    content = (
      <div className="absolute inset-0 flex">
        <div className="relative w-1/2 overflow-hidden" style={{ backgroundColor: p.overlay_color || "#000" }}>
          {p.image_url && (
            <img src={p.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
          )}
        </div>
        <div className="flex w-1/2 flex-col gap-[4%] p-[5%]" style={{ backgroundColor: p.background_color, color: p.color_texto, borderLeft: `2px solid ${p.color_acento}` }}>
          <Header align="left" />
          <div className="flex-1 space-y-[4%] overflow-hidden">
            {items.map((item) => (
              <DishRow key={item.plato} item={item} showDesc={false} />
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    const items = itemsOf(ARCHETYPES.lista_limpia.maxItems);
    const half = Math.ceil(items.length / 2);
    const columns = items.length > 4 ? [items.slice(0, half), items.slice(half)] : [items];
    content = (
      <div className="absolute inset-0 flex flex-col p-[5%]" style={{ backgroundColor: p.background_color, color: p.color_texto }}>
        <Header />
        <div className="mt-[4%] h-px" style={{ backgroundColor: p.color_acento, opacity: 0.45 }} />
        <div className={cn("mt-[4%] grid flex-1 gap-[6%] overflow-hidden", columns.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {columns.map((column, i) => (
            <div key={i} className="space-y-[4%]">
              {column.map((item) => (
                <DishRow key={item.plato} item={item} showDesc={items.length <= 5} />
              ))}
            </div>
          ))}
        </div>
        {p.footer_texto && (
          <p className="mt-[3%] text-center uppercase" style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.footer), color: p.color_acento }}>
            {p.footer_texto}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="absolute left-0 top-0 origin-top-left overflow-hidden"
      style={{ width: size.w, height: size.h, backgroundColor: p.background_color, transform: `scale(${scale})` }}
    >
      {content}
    </div>
  );
}

/** Wrapper that keeps the exact screen aspect ratio and measures its own width. */
function Stage({ p, formato, className }: { p: Proposal; formato: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: `${size.w} / ${size.h}`, backgroundColor: p.background_color }}
    >
      {w > 0 && <Piece p={p} formato={formato} width={w} />}
    </div>
  );
}

function FullscreenPreview({ p, formato, onClose }: { p: Proposal; formato: string; onClose: () => void }) {
  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];
  useEffect(() => {

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-6 animate-fade-in" onClick={onClose}>
      <div
        className="w-full"
        style={{ maxWidth: `min(1600px, calc(88vh * ${size.w} / ${size.h}))` }}
        onClick={(e) => e.stopPropagation()}
      >
        <Stage p={p} formato={formato} className="shadow-2xl" />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute right-6 top-6 text-white/80 hover:text-white"
      >
        <X className="h-4 w-4" /> Cerrar
      </Button>
    </div>,
    document.body,
  );
}

export default function ProposalSelector({
  propuestas,
  formato,
  onSelect,
  onRegenerate,
  loading,
  fallidos = [],
  retryTarget = null,
  onRetryArchetype,
}: Props) {
  const [descartadas, setDescartadas] = useState<number[]>([]);
  const [fullscreen, setFullscreen] = useState<Proposal | null>(null);

  const visibles = useMemo(() => propuestas.filter((p) => !descartadas.includes(p.id)), [propuestas, descartadas]);
  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Elige una propuesta</h2>
          <p className="text-sm text-muted-foreground">
            Tres formatos distintos, no tres colores. Pasa el mouse para verla en grande.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 border-sidebar-border" onClick={onRegenerate} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          {loading ? "Generando…" : "Regenerar"}
        </Button>
      </div>


      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => {
          const archetype = ARCHETYPES[archetypeOf(p)];

          return (
            <div
              key={p.id}
              className="flex flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <HoverCard openDelay={200} closeDelay={80}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelect(p)}
                    className="group relative block w-full text-left"
                    aria-label={`Elegir ${p.nombre}`}
                  >
                    <Stage p={p} formato={formato} />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Usar este diseño
                    </span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="top" align="center" className="w-[min(80vw,720px)] p-2">
                  <Stage p={p} formato={formato} className="rounded-md" />
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Tamaño real de reproducción · {archetype.label}
                  </p>
                </HoverCardContent>
              </HoverCard>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {archetype.label}
                  </span>
                  <p className="mt-1.5 text-sm font-medium">{p.nombre}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.concepto || archetype.resumen}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start px-2 text-xs text-muted-foreground"
                  onClick={() => setFullscreen(p)}
                >
                  <Maximize2 className="h-3.5 w-3.5" /> Vista previa en pantalla completa
                </Button>

                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Button size="sm" className="flex-1" onClick={() => onSelect(p)}>
                    <Check className="h-3.5 w-3.5" /> Usar este diseño
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onSelect(p)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setDescartadas((d) => [...d, p.id])}
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibles.length === 0 && (
        <div className="rounded-xl border border-dashed border-sidebar-border p-8 text-center text-sm text-muted-foreground">
          Descartaste todas las propuestas.
          <Button variant="outline" size="sm" className="ml-3" onClick={onRegenerate} disabled={loading}>
            <RotateCcw className="h-3.5 w-3.5" /> Generar otras
          </Button>
        </div>
      )}

      {fullscreen && <FullscreenPreview p={fullscreen} formato={formato} onClose={() => setFullscreen(null)} />}
    </div>
  );
}
