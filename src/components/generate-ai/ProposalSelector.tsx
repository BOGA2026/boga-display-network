import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { Proposal } from "./types";
import { CANVAS_SIZES } from "./types";

interface Props {
  propuestas: Proposal[];
  formato: string;
  onSelect: (p: Proposal) => void;
  onRegenerate: () => void;
  loading: boolean;
}

export default function ProposalSelector({ propuestas, formato, onSelect, onRegenerate, loading }: Props) {
  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];
  const isVertical = formato === "9:16";
  const previewW = isVertical ? 170 : 300;
  const previewH = isVertical ? 300 : 170;
  const scale = previewW / size.w;

  const renderMenuPreview = (p: Proposal) => {
    const sections = p.secciones ?? [];
    const halfway = Math.ceil(sections.length / 2);
    const columns = [sections.slice(0, halfway), sections.slice(halfway)];

    return (
      <div className="absolute inset-0 flex flex-col px-[7%] py-[6%]" style={{ color: p.color_texto }}>
        <div className="text-center">
          <p
            className="font-bold uppercase leading-none"
            style={{
              fontFamily: p.fuente_titulo,
              fontSize: Math.max(((p.header?.size ?? 48) * scale), 12),
            }}
          >
            {p.header?.nombre_restaurante || p.texto_principal}
          </p>
          <p
            className="mt-1 italic"
            style={{
              fontFamily: p.fuente_cuerpo,
              fontSize: Math.max(12 * scale, 6),
              color: p.color_acento,
            }}
          >
            {p.header?.tagline || p.texto_secundario}
          </p>
        </div>

        <div className="mt-[5%] h-px" style={{ backgroundColor: p.color_acento, opacity: 0.45 }} />

        <div className="mt-[4%] grid flex-1 grid-cols-2 gap-[6%] overflow-hidden">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className={cn("space-y-[4%]", colIndex === 1 && "border-l pl-[8%]")} style={colIndex === 1 ? { borderColor: p.color_acento, opacity: 0.95 } : undefined}>
              {column.map((section) => (
                <div key={section.nombre} className="space-y-[2%]">
                  <p
                    className="font-bold uppercase"
                    style={{
                      fontFamily: p.fuente_cuerpo,
                      fontSize: Math.max(12 * scale, 6),
                      color: p.color_acento,
                    }}
                  >
                    {section.nombre}
                  </p>
                  {(section.items ?? []).slice(0, 3).map((item) => (
                    <div key={`${section.nombre}-${item.plato}`} className="space-y-[1%]">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="truncate font-semibold"
                          style={{ fontFamily: p.fuente_cuerpo, fontSize: Math.max(13 * scale, 6.5) }}
                        >
                          {item.plato}
                        </span>
                        <span
                          className="shrink-0 font-bold"
                          style={{ fontFamily: p.fuente_cuerpo, fontSize: Math.max(13 * scale, 6.5), color: p.color_acento }}
                        >
                          {item.precio}
                        </span>
                      </div>
                      {item.descripcion && (
                        <p
                          className="line-clamp-1 italic opacity-70"
                          style={{ fontFamily: p.fuente_cuerpo, fontSize: Math.max(10 * scale, 5.5) }}
                        >
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {p.footer_texto && (
          <p
            className="mt-[3%] text-center uppercase"
            style={{
              fontFamily: p.fuente_cuerpo,
              fontSize: Math.max(11 * scale, 6),
              color: p.color_acento,
            }}
          >
            {p.footer_texto}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Elige una propuesta</h2>
          <p className="text-sm text-muted-foreground">La IA generó 3 opciones. Haz clic para editar.</p>
        </div>
        <Button variant="outline" size="sm" className="border-sidebar-border" onClick={onRegenerate} disabled={loading}>
          <RotateCcw className="h-3.5 w-3.5" />
          Regenerar
        </Button>
      </div>

      <div className={cn("grid gap-5", isVertical ? "grid-cols-3 max-w-2xl" : "grid-cols-1 sm:grid-cols-3")}>
        {propuestas.map((p) => {
          const textAlign = p.layout === "izquierda" ? "left" : p.layout === "derecha" ? "right" : "center";
          const pad = "10%";
          const tSize = Math.max((p.titulo_size ?? 84) * scale, 12);
          const sSize = Math.max((p.subtitulo_size ?? 28) * scale, 7);
          const isMenu = p.tipo_layout === "menu_dos_columnas" || (p.secciones?.length ?? 0) > 0;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="group rounded-xl border border-sidebar-border bg-sidebar overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] text-left"
            >
              {/* Mini preview */}
              <div
                className="relative overflow-hidden mx-auto"
                style={{
                  width: previewW,
                  height: previewH,
                  backgroundColor: p.background_color,
                }}
              >
                {/* Real Unsplash background image */}
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                )}

                {/* Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: p.overlay_color || "rgba(0,0,0,0.55)",
                    opacity: p.overlay_opacity ?? 0.55,
                  }}
                />

                {/* Decorative elements preview */}
                {p.elementos_decorativos?.map((el, i) => {
                  if (el.tipo === "banda_inferior") {
                    return (
                      <div key={i} className="absolute bottom-0 left-0 right-0" style={{
                        height: `${15}%`, backgroundColor: el.color, opacity: el.opacity,
                      }} />
                    );
                  }
                  if (el.tipo === "linea_acento_vertical") {
                    return (
                      <div key={i} className="absolute top-[30%]" style={{
                        left: textAlign === "right" ? "auto" : `${8}%`,
                        right: textAlign === "right" ? `${8}%` : "auto",
                        width: 3 * scale > 1 ? 3 : 1.5,
                        height: 40, backgroundColor: el.color, opacity: el.opacity,
                      }} />
                    );
                  }
                  if (el.tipo === "punto_decorativo") {
                    return (
                      <div key={i} className="absolute rounded-full" style={{
                        width: 80, height: 80, right: -20, top: -20,
                        backgroundColor: el.color, opacity: el.opacity,
                      }} />
                    );
                  }
                  return null;
                })}

                {/* Text content */}
                {isMenu ? renderMenuPreview(p) : (
                  <div
                    className="absolute inset-0 flex flex-col justify-center"
                    style={{ textAlign, padding: pad }}
                  >
                    <p
                      className="font-bold leading-tight"
                      style={{
                        fontFamily: p.fuente_titulo,
                        fontSize: tSize,
                        color: p.color_texto,
                        fontWeight: 800,
                      }}
                    >
                      {p.texto_principal}
                    </p>

                    <p
                      className="leading-snug opacity-85"
                      style={{
                        fontFamily: p.fuente_cuerpo,
                        fontSize: sSize,
                        color: p.color_texto,
                        fontWeight: 300,
                        marginTop: 4 * scale,
                      }}
                    >
                      {p.texto_secundario}
                    </p>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="px-3 py-2.5">
                <span className="text-sm font-medium block">{p.nombre}</span>
                {p.concepto && <span className="text-[10px] text-muted-foreground block mt-0.5">{p.concepto}</span>}
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
