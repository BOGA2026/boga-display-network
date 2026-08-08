import { FOOD_ICONS } from "./icons.food";
import { SERVICE_ICONS, seasonElements } from "./icons.service";
import { BADGE_ELEMENTS, DIET_ELEMENTS } from "./badges";
import { PRICE_ELEMENTS, DIVIDER_ELEMENTS, SHAPE_ELEMENTS, BACKGROUND_ELEMENTS } from "./graphics";
import type { CategoryId, ElementDef } from "./types";

export { CATEGORY_LABELS } from "./types";
export type { CategoryId, ElementDef } from "./types";

/** Sinónimos regionales: escribir cualquiera encuentra el elemento. */
const SYNONYMS: Record<string, string[]> = {
  gaseosa: ["refresco", "soda", "cola"],
  jugo: ["zumo", "batido"],
  domicilio: ["delivery", "envio", "rappi"],
  arepa: ["maiz"],
  corrientazo: ["almuerzo", "menu del dia", "bandeja"],
  tinto: ["cafe"],
  pola: ["cerveza"],
  sanduche: ["sandwich"],
  perro: ["hot dog"],
  papas: ["french fries", "fritas"],
  helado: ["mantecado"],
  aji: ["picante"],
  plata: ["precio", "valor", "dinero"],
};

export const ALL_ELEMENTS = (now = new Date()): ElementDef[] => [
  ...FOOD_ICONS,
  ...BADGE_ELEMENTS,
  ...DIET_ELEMENTS,
  ...PRICE_ELEMENTS,
  ...DIVIDER_ELEMENTS,
  ...SERVICE_ICONS,
  ...seasonElements(now),
  ...SHAPE_ELEMENTS,
  ...BACKGROUND_ELEMENTS,
];

export const CATEGORY_ORDER: CategoryId[] = [
  "sugeridos",
  "comida",
  "etiquetas",
  "dieta",
  "precios",
  "divisores",
  "servicio",
  "temporadas",
  "formas",
  "fondos",
];

/** Quita tildes y baja a minúsculas para que el buscador tolere "cafe" y "café". */
export const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function haystack(el: ElementDef) {
  const extra = el.tags.flatMap((t) => SYNONYMS[norm(t)] ?? []);
  return norm([el.label, ...el.tags, ...extra, el.text ?? ""].join(" "));
}

export function searchElements(list: ElementDef[], query: string): ElementDef[] {
  const q = norm(query);
  if (!q) return list;
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = list
    .map((el) => {
      const h = haystack(el);
      let score = 0;
      for (const t of terms) {
        const i = h.indexOf(t);
        if (i < 0) return null;
        score += i === 0 ? 3 : h.includes(` ${t}`) ? 2 : 1;
      }
      return { el, score };
    })
    .filter((x): x is { el: ElementDef; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.el);
}

/** Elementos priorizados según la categoría del negocio (Ajustes). */
const SUGGESTED_BY_CATEGORY: Record<string, string[]> = {
  restaurante: ["comida-bandeja", "comida-carne", "comida-pollo", "comida-sopa", "comida-pescado", "comida-ensalada", "comida-jugo", "comida-postre"],
  cafeteria: ["comida-cafe", "comida-capuchino", "comida-te", "comida-croissant", "comida-torta", "comida-galleta", "comida-cheesecake", "comida-chocolate"],
  comidas_rapidas: ["comida-hamburguesa", "comida-papas", "comida-perro", "comida-salchipapa", "comida-gaseosa", "comida-pizza", "comida-nachos", "comida-malteada"],
  panaderia: ["comida-pan", "comida-croissant", "comida-buñuelo", "comida-tostada", "comida-cafe", "comida-torta", "comida-galleta", "comida-dona"],
  bar: ["comida-cerveza", "comida-coctel", "comida-vino", "comida-michelada", "comida-alitas", "comida-nachos", "comida-papas", "etiqueta-happy-hour-pildora"],
};

const ALWAYS_SUGGESTED = [
  "etiqueta-nuevo-cinta",
  "etiqueta-promocion-pildora",
  "etiqueta-mas-pedido-circulo",
  "precio-circulo",
  "precio-tachado",
  "div-cubiertos",
  "servicio-domicilio",
  "servicio-whatsapp",
  "servicio-nequi",
  "dieta-vegetariano",
  "dieta-picante-1",
  "fondo-pizarra",
];

/** Construye la categoría "Sugeridos para ti". */
export function suggestedElements(list: ElementDef[], businessCategory?: string | null): ElementDef[] {
  const ids = [...(SUGGESTED_BY_CATEGORY[businessCategory ?? ""] ?? SUGGESTED_BY_CATEGORY.restaurante), ...ALWAYS_SUGGESTED];
  const byId = new Map(list.map((e) => [e.id, e]));
  const out: ElementDef[] = [];
  for (const id of ids) {
    const el = byId.get(id);
    if (el && !out.includes(el)) out.push({ ...el, id: `sugerido-${el.id}`, category: "sugeridos" });
  }
  // Completa con la temporada más cercana.
  const season = list.find((e) => e.category === "temporadas");
  if (season) out.push({ ...season, id: `sugerido-${season.id}`, category: "sugeridos" });
  return out;
}
