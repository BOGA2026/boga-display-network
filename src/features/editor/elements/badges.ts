import { rawSvg, centeredText } from "./svg";
import type { ElementDef } from "./types";

type Shape = "cinta" | "circulo" | "pildora";

const SHAPE_LABEL: Record<Shape, string> = {
  cinta: "cinta",
  circulo: "círculo",
  pildora: "píldora",
};

/** Insignias comerciales y temporales, cada una en tres formas. */
const LABELS: { id: string; text: string; tags: string[] }[] = [
  { id: "nuevo", text: "NUEVO", tags: ["nuevo", "novedad", "lanzamiento"] },
  { id: "promocion", text: "PROMOCIÓN", tags: ["promocion", "promo", "oferta", "descuento"] },
  { id: "2x1", text: "2x1", tags: ["2x1", "dos por uno", "promo", "combo"] },
  { id: "combo", text: "COMBO", tags: ["combo", "paquete", "menu completo"] },
  { id: "recomendado", text: "RECOMENDADO", tags: ["recomendado", "sugerido", "favorito"] },
  { id: "mas-pedido", text: "EL MÁS PEDIDO", tags: ["el mas pedido", "popular", "top", "bestseller"] },
  { id: "chef", text: "ESPECIAL DEL CHEF", tags: ["especial del chef", "chef", "plato especial"] },
  { id: "ultimas", text: "ÚLTIMAS UNIDADES", tags: ["ultimas unidades", "quedan pocas", "limitado"] },
  { id: "agotado", text: "AGOTADO", tags: ["agotado", "sin existencias", "no disponible"] },
  { id: "descuento", text: "DESCUENTO", tags: ["descuento", "rebaja", "off", "promo"] },
  { id: "solo-hoy", text: "SOLO HOY", tags: ["solo hoy", "hoy", "temporal"] },
  { id: "happy-hour", text: "HAPPY HOUR", tags: ["happy hour", "hora feliz", "bar", "promo"] },
  { id: "promo-dia", text: "PROMO DEL DÍA", tags: ["promo del dia", "plato del dia", "corrientazo"] },
  { id: "fin-semana", text: "FIN DE SEMANA", tags: ["fin de semana", "sabado", "domingo", "promo"] },
];

function shapeSvg(shape: Shape) {
  if (shape === "circulo") {
    return rawSvg(`<circle cx="110" cy="110" r="102" fill="__C__"/><circle cx="110" cy="110" r="88" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-opacity="0.55"/>`, "0 0 220 220");
  }
  if (shape === "pildora") {
    return rawSvg(`<rect x="4" y="4" width="472" height="132" rx="66" fill="__C__"/>`, "0 0 480 140");
  }
  // Cinta diagonal
  return rawSvg(
    `<g transform="rotate(-12 240 90)"><path d="M8 24h464l-40 66 40 66H8l40-66Z" fill="__C__"/></g>`,
    "0 0 480 180",
  );
}

const SIZE: Record<Shape, [number, number]> = {
  cinta: [560, 210],
  circulo: [280, 280],
  pildora: [520, 152],
};

export const BADGE_ELEMENTS: ElementDef[] = LABELS.flatMap((l) =>
  (["cinta", "circulo", "pildora"] as Shape[]).map<ElementDef>((shape) => ({
    id: `etiqueta-${l.id}-${shape}`,
    label: `${l.text} · ${SHAPE_LABEL[shape]}`,
    tags: [...l.tags, "etiqueta", "insignia", "sticker", SHAPE_LABEL[shape]],
    category: "etiquetas",
    kind: "badge",
    size: SIZE[shape],
    svg: () => shapeSvg(shape),
    text: l.text,
    textColor: "light",
    textSize: shape === "circulo" ? 46 : 54,
  })),
);

/* ───────── Dieta y alérgenos ───────── */

const DIET: { id: string; text: string; tags: string[]; glyph: string }[] = [
  { id: "vegetariano", text: "VEGETARIANO", tags: ["vegetariano", "veggie", "sin carne"], glyph: `<path d="M30 62c0-16 12-28 28-28 0 16-12 28-28 28Z" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/><path d="M30 62 20 72" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>` },
  { id: "vegano", text: "VEGANO", tags: ["vegano", "vegan", "sin animal"], glyph: `<path d="M22 70c0-22 16-38 38-38 0 22-16 38-38 38Z" fill="#FFFFFF"/>` },
  { id: "sin-gluten", text: "SIN GLUTEN", tags: ["sin gluten", "gluten free", "celiaco"], glyph: `<path d="M40 22v56" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/><path d="M40 36c8-8 16-8 16-8M40 52c8-8 16-8 16-8M40 36c-8-8-16-8-16-8M40 52c-8-8-16-8-16-8" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M16 78 66 22" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>` },
  { id: "sin-lactosa", text: "SIN LACTOSA", tags: ["sin lactosa", "deslactosado", "leche"], glyph: `<path d="M32 26h20v12l8 14v28H24V52l8-14Z" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/><path d="M16 78 66 22" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>` },
  { id: "sin-azucar", text: "SIN AZÚCAR", tags: ["sin azucar", "light", "diabetico"], glyph: `<rect x="22" y="34" width="36" height="32" rx="6" fill="none" stroke="#FFFFFF" stroke-width="6"/><path d="M16 78 66 22" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>` },
  { id: "picante-1", text: "PICANTE", tags: ["picante", "aji", "suave", "nivel 1"], glyph: chili(1) },
  { id: "picante-2", text: "MUY PICANTE", tags: ["picante", "aji", "medio", "nivel 2"], glyph: chili(2) },
  { id: "picante-3", text: "EXTRA PICANTE", tags: ["picante", "aji", "fuerte", "nivel 3"], glyph: chili(3) },
  { id: "nueces", text: "CONTIENE NUECES", tags: ["nueces", "mani", "alergeno", "frutos secos"], glyph: `<path d="M40 24c14 0 24 12 24 26S54 76 40 76 16 64 16 50 26 24 40 24Z" fill="none" stroke="#FFFFFF" stroke-width="6"/><path d="M40 26v48M24 40h32M24 60h32" stroke="#FFFFFF" stroke-width="5"/>` },
  { id: "mariscos", text: "CONTIENE MARISCOS", tags: ["mariscos", "camaron", "alergeno", "mar"], glyph: `<path d="M18 62a24 24 0 0 1 48 0Z" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/><path d="M18 62h48M30 62V44M42 62V40M54 62V44" stroke="#FFFFFF" stroke-width="5"/>` },
  { id: "organico", text: "ORGÁNICO", tags: ["organico", "natural", "eco"], glyph: `<path d="M24 72c0-26 18-44 44-44 0 26-18 44-44 44Z" fill="none" stroke="#FFFFFF" stroke-width="6"/><path d="M24 72 60 36" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>` },
  { id: "light", text: "LIGHT", tags: ["light", "bajo en calorias", "saludable"], glyph: `<path d="M40 20 22 54h14l-6 26 26-38H40l8-22Z" fill="#FFFFFF"/>` },
];

function chili(level: number) {
  const one = (x: number) =>
    `<g transform="translate(${x} 0)"><path d="M26 30c10 0 16 8 16 18s-8 24-18 24-14-8-14-16 6-26 16-26Z" fill="#FFFFFF"/><path d="M26 30c0-8 6-12 12-10" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/></g>`;
  return Array.from({ length: level }, (_, i) => one(i * 34)).join("");
}

export const DIET_ELEMENTS: ElementDef[] = DIET.map((d) => {
  const width = 34 + d.text.length * 22 + (d.id.startsWith("picante") ? 34 * (Number(d.id.slice(-1)) - 1) : 0);
  return {
    id: `dieta-${d.id}`,
    label: d.text.charAt(0) + d.text.slice(1).toLowerCase(),
    tags: [...d.tags, "dieta", "alergeno", "distintivo"],
    category: "dieta",
    kind: "diet",
    // Tamaño pequeño por defecto: acompaña al nombre del plato.
    size: [Math.round(width * 0.62), 56],
    svg: () =>
      rawSvg(
        `<rect x="2" y="2" width="${width + 96}" height="96" rx="48" fill="__C__"/>` +
          `<g transform="translate(24 6) scale(0.86)">${d.glyph}</g>` +
          centeredText(d.text, {
            x: 96 + width / 2,
            y: 52,
            size: 34,
            fill: "#FFFFFF",
            weight: 800,
            letter: 1.5,
          }),
        `0 0 ${width + 100} 100`,
      ),
  };
});
