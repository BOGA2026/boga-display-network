import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Maximize2, RotateCcw, Pencil, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import type { Proposal } from "./types";
import { CANVAS_SIZES } from "./types";
import { tvTypography, clampMenuSections } from "@/lib/tvLegibility";
import { buildPieceLayout } from "@/lib/pieceLayout";
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
 * Renders a proposal at the exact aspect ratio of the target screen using the
 * shared layout engine: the geometry drawn here is the same geometry
 * validarPropuesta() checks, so nothing is truncated, nothing overlaps and the
 * darkening layer only covers the text zone.
 */
function Piece({ p, formato, width }: { p: Proposal; formato: string; width: number }) {
  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];
  const scale = width / size.w;
  const layout = useMemo(() => buildPieceLayout(p as any, size.w, size.h), [p, size.w, size.h]);
  const { fonts, colors, margin, region } = layout;
  const archetype = ARCHETYPES[archetypeOf(p)];
  const overlay = Math.min(0.65, Math.max(0.45, p.overlay_opacity ?? 0.5));
  const logo = (p as any).logo_url as string | undefined;

  const Header = ({ align = "center" as "center" | "left" }) => (
    <div style={{ textAlign: align }}>
      <p className="font-bold uppercase leading-none" style={{ fontFamily: p.fuente_titulo, fontSize: fonts.header, color: colors.texto }}>
        {layout.headerTitle}
      </p>
      {layout.headerSubtitle && (
        <p style={{ fontFamily: p.fuente_cuerpo, fontSize: fonts.tagline, color: colors.precio, marginTop: fonts.tagline * 0.3 }}>
          {layout.headerSubtitle}
        </p>
      )}
    </div>
  );

  /** Dish row: name and price share baseline and size; the name never truncates. */
  const DishRow = ({ dish }: { dish: (typeof layout.columns)[number][number] }) => (
    <div style={{ marginBottom: 0 }}>
      <div className="flex items-baseline justify-between" style={{ gap: fonts.name * 0.5 }}>
        <span
          className="font-bold"
          style={{ fontFamily: p.fuente_cuerpo, fontSize: fonts.name, lineHeight: 1.15, color: colors.texto }}
        >
          {dish.lines.map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </span>
        <span
          className="shrink-0 font-extrabold"
          style={{ fontFamily: p.fuente_cuerpo, fontSize: fonts.price, lineHeight: 1.15, color: colors.precio }}
        >
          {dish.precio}
        </span>
      </div>
      {dish.descripcion && (
        <p style={{ fontFamily: p.fuente_cuerpo, fontSize: fonts.desc, lineHeight: 1.2, color: colors.texto, opacity: 0.8, marginTop: fonts.name * 0.15 }}>
          {dish.descripcion}
        </p>
      )}
    </div>
  );

  const Closing = () =>
    logo ? (
      <img src={logo} alt="" crossOrigin="anonymous" style={{ height: fonts.closing * 1.6, objectFit: "contain" }} />
    ) : layout.closingText ? (
      <p className="uppercase" style={{ fontFamily: p.fuente_cuerpo, fontSize: fonts.closing, color: colors.precio, letterSpacing: "0.08em" }}>
        {layout.closingText}
      </p>
    ) : (
      <p className="font-bold uppercase" style={{ fontFamily: p.fuente_titulo, fontSize: fonts.closing, color: colors.precio }}>
        {layout.headerTitle}
      </p>
    );

  const DishColumns = ({ justify = "space-between" }: { justify?: string }) => (
    <div className="flex flex-1" style={{ gap: size.w * 0.02 }}>
      {layout.columns.map((column, i) => (
        <div key={i} className="flex flex-1 flex-col" style={{ justifyContent: justify }}>
          {column.map((dish) => (
            <DishRow key={`${i}-${dish.plato}`} dish={dish} />
          ))}
        </div>
      ))}
    </div>
  );

  let content: JSX.Element;

  if (archetype.id === "foto_protagonista" && p.image_url) {
    content = (
      <>
        <img src={p.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
        {/* Oscurecimiento SOLO en la zona del texto: degradado desde abajo + banda superior. */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: size.h - region.y + margin,
            background: `linear-gradient(to top, ${p.overlay_color || "#000"} ${Math.round(overlay * 100)}%, transparent)`,
            opacity: 0.98,
          }}
        />
        <div
          className="absolute inset-x-0 top-0"
          style={{ height: fonts.header * 2.4, background: `linear-gradient(to bottom, rgba(0,0,0,${overlay}), transparent)` }}
        />
        <div className="absolute" style={{ left: margin, right: margin, top: margin }}>
          <Header />
        </div>
        <div className="absolute flex flex-col" style={{ left: region.x, top: region.y, width: region.w, height: region.h }}>
          <DishColumns />
          <div className="flex items-center justify-center" style={{ height: size.h * 0.08 }}>
            <Closing />
          </div>
        </div>
      </>
    );
  } else if (archetype.id === "dividido") {
    const marca = (p as any).bloque_marca && !p.image_url;
    content = (
      <div className="absolute inset-0 flex">
        <div className="relative flex w-1/2 items-center justify-center overflow-hidden" style={{ backgroundColor: marca ? p.color_acento : p.background_color }}>
          {p.image_url ? (
            <img src={p.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
          ) : logo ? (
            <img src={logo} alt="" crossOrigin="anonymous" style={{ width: "55%", objectFit: "contain" }} />
          ) : (
            <p className="px-[8%] text-center font-bold uppercase leading-tight" style={{ fontFamily: p.fuente_titulo, fontSize: fonts.header, color: colors.texto }}>
              {layout.headerTitle}
            </p>
          )}
        </div>
        <div className="w-1/2" style={{ backgroundColor: p.background_color, borderLeft: `2px solid ${colors.precio}` }} />
        <div className="absolute flex flex-col" style={{ left: region.x, top: region.y, width: region.w, height: region.h }}>
          <Header align="left" />
          <DishColumns />
          <div className="flex items-center" style={{ height: size.h * 0.08 }}>
            <Closing />
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="absolute inset-0" style={{ backgroundColor: p.background_color }}>
        <div className="absolute flex flex-col" style={{ left: region.x, top: region.y, width: region.w, height: region.h }}>
          <Header />
          <div style={{ height: 2, backgroundColor: colors.precio, opacity: 0.4, margin: `${fonts.header * 0.3}px 0` }} />
          <DishColumns />
          <div className="flex items-center justify-center" style={{ height: size.h * 0.08 }}>
            <Closing />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute left-0 top-0 origin-top-left overflow-hidden"
      style={{ width: size.w, height: size.h, backgroundColor: p.background_color, color: colors.texto, transform: `scale(${scale})` }}
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

        {/* Slots que fallaron: el resto de propuestas se conserva. */}
        {fallidos.map((a) => {
          const reintentando = retryTarget === a;
          return (
            <div key={`fail-${a}`} className="flex flex-col overflow-hidden rounded-xl border border-destructive/30 bg-sidebar">
              <div
                className={cn("flex w-full items-center justify-center bg-destructive/5", reintentando && "animate-pulse")}
                style={{ aspectRatio: `${size.w} / ${size.h}` }}
              >
                {reintentando ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <span className="inline-flex rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                    {ARCHETYPES[a]?.label ?? a}
                  </span>
                  <p className="mt-1.5 text-sm font-medium">No pudimos generar esta propuesta</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {reintentando ? "Reintentando…" : "Las otras siguen disponibles. Puedes reintentar solo esta."}
                  </p>
                </div>
                <div className="mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-sidebar-border"
                    disabled={loading || !onRetryArchetype}
                    onClick={() => onRetryArchetype?.(a)}
                  >
                    {reintentando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Reintentar
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibles.length === 0 && fallidos.length === 0 && (
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
