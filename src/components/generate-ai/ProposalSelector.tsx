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
  const previewW = isVertical ? 180 : 320;
  const previewH = isVertical ? 320 : 180;
  const scale = previewW / size.w;

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
          const pad = p.layout === "centrado" ? "10%" : "10%";

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
                {/* Overlay */}
                {p.background_image_query && (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: `rgba(0,0,0,${p.overlay_opacity})` }}
                  />
                )}

                {/* Accent elements */}
                {p.elementos.includes("rectangulo_acento") && (
                  <div
                    className="absolute left-0 top-0 bottom-0"
                    style={{ width: 4 * scale > 2 ? 4 : 2, backgroundColor: p.color_acento }}
                  />
                )}
                {p.elementos.includes("badge_superior") && (
                  <div
                    className="absolute top-2 rounded-sm px-2 py-0.5 text-[8px] font-medium"
                    style={{
                      backgroundColor: p.color_acento,
                      color: p.color_texto,
                      left: textAlign === "right" ? "auto" : textAlign === "center" ? "50%" : "10%",
                      right: textAlign === "right" ? "10%" : "auto",
                      transform: textAlign === "center" ? "translateX(-50%)" : "none",
                    }}
                  >
                    {p.texto_cta}
                  </div>
                )}

                {/* Text content */}
                <div
                  className="absolute inset-0 flex flex-col justify-center"
                  style={{ textAlign, padding: pad }}
                >
                  <p
                    className="font-bold leading-tight"
                    style={{
                      fontFamily: p.fuente_titulo,
                      fontSize: Math.max(60 * scale, 10),
                      color: p.color_texto,
                    }}
                  >
                    {p.texto_principal}
                  </p>

                  {p.elementos.includes("linea_divisora") && (
                    <div
                      className="my-1"
                      style={{
                        height: 1,
                        width: "40%",
                        backgroundColor: p.color_acento,
                        marginLeft: textAlign === "center" ? "auto" : textAlign === "right" ? "auto" : 0,
                        marginRight: textAlign === "center" ? "auto" : textAlign === "right" ? 0 : "auto",
                      }}
                    />
                  )}

                  <p
                    className="leading-snug opacity-80"
                    style={{
                      fontFamily: p.fuente_cuerpo,
                      fontSize: Math.max(26 * scale, 7),
                      color: p.color_texto,
                      marginTop: 4 * scale,
                    }}
                  >
                    {p.texto_secundario}
                  </p>
                </div>
              </div>

              {/* Label */}
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-sm font-medium">{p.nombre}</span>
                <div className="flex gap-1.5">
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