import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
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
}

const archetypeOf = (p: Proposal): ArchetypeId =>
  p.arquetipo && ARCHETYPES[p.arquetipo] ? p.arquetipo : "lista_limpia";

export default function ProposalSelector({ propuestas, formato, onSelect, onRegenerate, loading }: Props) {
  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];
  const isVertical = formato === "9:16";
  const previewW = isVertical ? 170 : 300;
  const previewH = isVertical ? 300 : 170;
  const scale = previewW / size.w;
  const t = tvTypography(size.h, size.w);
  const px = (v: number) => Math.max(v * scale, 5.5);

  const itemsOf = (p: Proposal, max: number) =>
    clampMenuSections(p.secciones ?? [], t.maxDescChars, max).flatMap((s) =>
      (s.items ?? []).map((i) => ({ ...i, seccion: s.nombre })),
    );

  const Header = ({ p, align = "center" }: { p: Proposal; align?: "center" | "left" }) => (
    <div style={{ textAlign: align }}>
      <p
        className="font-bold uppercase leading-none"
        style={{ fontFamily: p.fuente_titulo, fontSize: px(Math.max(p.header?.size ?? 0, t.restaurante)) }}
      >
        {p.header?.nombre_restaurante || p.texto_principal}
      </p>
      {(p.header?.tagline || p.texto_secundario) && (
        <p
          className="mt-1 truncate"
          style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.tagline), color: p.color_acento }}
        >
          {p.header?.tagline || p.texto_secundario}
        </p>
      )}
    </div>
  );

  const DishRow = ({ p, item, showDesc = true }: { p: Proposal; item: any; showDesc?: boolean }) => (
    <div className="space-y-[1%]">
      <div className="flex items-start justify-between gap-2">
        <span className="truncate font-bold" style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.plato) }}>
          {item.plato}
        </span>
        <span
          className="shrink-0 font-extrabold"
          style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.precio), color: p.color_acento }}
        >
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

  /** 1 — FOTO PROTAGONISTA: photo full bleed + dishes over a solid bottom band. */
  const renderFotoProtagonista = (p: Proposal) => {
    const items = itemsOf(p, ARCHETYPES.foto_protagonista.maxItems);
    return (
      <>
        {p.image_url && (
          <img src={p.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: p.overlay_color || "#000", opacity: p.overlay_opacity ?? 0.6 }} />
        <div className="absolute inset-x-0 top-0 p-[5%]" style={{ color: p.color_texto }}>
          <Header p={p} />
        </div>
        <div
          className="absolute inset-x-0 bottom-0 space-y-[3%] p-[5%]"
          style={{ backgroundColor: p.background_color, color: p.color_texto }}
        >
          {items.map((item) => (
            <DishRow key={item.plato} p={p} item={item} showDesc={items.length <= 2} />
          ))}
        </div>
      </>
    );
  };

  /** 2 — LISTA LIMPIA: no photography, brand colors, up to 7 dishes in two columns. */
  const renderListaLimpia = (p: Proposal) => {
    const items = itemsOf(p, ARCHETYPES.lista_limpia.maxItems);
    const half = Math.ceil(items.length / 2);
    const columns = items.length > 4 ? [items.slice(0, half), items.slice(half)] : [items];
    return (
      <div className="absolute inset-0 flex flex-col p-[5%]" style={{ backgroundColor: p.background_color, color: p.color_texto }}>
        <Header p={p} />
        <div className="mt-[4%] h-px" style={{ backgroundColor: p.color_acento, opacity: 0.45 }} />
        <div className={cn("mt-[4%] grid flex-1 gap-[6%] overflow-hidden", columns.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {columns.map((column, i) => (
            <div key={i} className="space-y-[4%]">
              {column.map((item) => (
                <DishRow key={item.plato} p={p} item={item} showDesc={items.length <= 5} />
              ))}
            </div>
          ))}
        </div>
        {p.footer_texto && (
          <p
            className="mt-[3%] text-center uppercase"
            style={{ fontFamily: p.fuente_cuerpo, fontSize: px(t.footer), color: p.color_acento }}
          >
            {p.footer_texto}
          </p>
        )}
      </div>
    );
  };

  /** 3 — DIVIDIDO: half image, half menu, clean split. */
  const renderDividido = (p: Proposal) => {
    const items = itemsOf(p, ARCHETYPES.dividido.maxItems);
    return (
      <div className="absolute inset-0 flex">
        <div className="relative w-1/2 overflow-hidden" style={{ backgroundColor: p.overlay_color || "#000" }}>
          {p.image_url && (
            <img src={p.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
          )}
        </div>
        <div
          className="flex w-1/2 flex-col gap-[4%] p-[5%]"
          style={{ backgroundColor: p.background_color, color: p.color_texto, borderLeft: `2px solid ${p.color_acento}` }}
        >
          <Header p={p} align="left" />
          <div className="flex-1 space-y-[4%] overflow-hidden">
            {items.map((item) => (
              <DishRow key={item.plato} p={p} item={item} showDesc={false} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGeneric = (p: Proposal) => {
    const textAlign = p.layout === "izquierda" ? "left" : p.layout === "derecha" ? "right" : "center";
    return (
      <>
        {p.image_url && (
          <img src={p.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" crossOrigin="anonymous" />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: p.overlay_color || "#000", opacity: p.overlay_opacity ?? 0.55 }} />
        <div className="absolute inset-0 flex flex-col justify-center p-[10%]" style={{ textAlign }}>
          <p
            className="font-bold leading-tight"
            style={{ fontFamily: p.fuente_titulo, fontSize: Math.max((p.titulo_size ?? 84) * scale, 12), color: p.color_texto, fontWeight: 800 }}
          >
            {p.texto_principal}
          </p>
          <p
            className="leading-snug opacity-85"
            style={{
              fontFamily: p.fuente_cuerpo,
              fontSize: Math.max((p.subtitulo_size ?? 28) * scale, 7),
              color: p.color_texto,
              fontWeight: 300,
              marginTop: 4 * scale,
            }}
          >
            {p.texto_secundario}
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Elige una propuesta</h2>
          <p className="text-sm text-muted-foreground">Tres formatos distintos, no tres colores. Haz clic para editar.</p>
        </div>
        <Button variant="outline" size="sm" className="border-sidebar-border" onClick={onRegenerate} disabled={loading}>
          <RotateCcw className="h-3.5 w-3.5" />
          Regenerar
        </Button>
      </div>

      <div className={cn("grid gap-5", isVertical ? "grid-cols-3 max-w-2xl" : "grid-cols-1 sm:grid-cols-3")}>
        {propuestas.map((p) => {
          const archetype = ARCHETYPES[archetypeOf(p)];
          const hasMenu = (p.secciones?.length ?? 0) > 0;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="group rounded-xl border border-sidebar-border bg-sidebar overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] text-left"
            >
              <div
                className="relative overflow-hidden mx-auto"
                style={{ width: previewW, height: previewH, backgroundColor: p.background_color }}
              >
                {!hasMenu
                  ? renderGeneric(p)
                  : archetype.id === "foto_protagonista"
                    ? renderFotoProtagonista(p)
                    : archetype.id === "dividido"
                      ? renderDividido(p)
                      : renderListaLimpia(p)}
              </div>

              <div className="px-3 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary block">
                  {archetype.label}
                </span>
                <span className="text-sm font-medium block">{p.nombre}</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {p.concepto || archetype.resumen}
                </span>
                <div className="flex gap-1.5 mt-1.5">
                  {[p.background_color, p.color_texto, p.color_acento].map((c, i) => (
                    <div key={i} className="h-3 w-3 rounded-full border border-sidebar-border" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
