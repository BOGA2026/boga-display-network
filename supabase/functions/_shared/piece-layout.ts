/**
 * Deterministic layout engine for AI-generated signage pieces.
 *
 * The renderer draws exactly what this function returns and the validator
 * checks exactly what this function returns, so "what you validate" and "what
 * you see on the TV" can never drift apart.
 *
 * Hard rules encoded here:
 * - Dish names and prices are NEVER truncated. When a name doesn't fit we
 *   remove dishes, then allow two lines (1.15 leading), and only as a last
 *   resort shrink to the 4% floor.
 * - Descriptions are optional: if they can't live at >= 2.2% of the height they
 *   are removed from the WHOLE piece, never shrunk.
 * - Dishes fill between 70% and 90% of the usable height; the bottom 8% is a
 *   closing strip (logo or short CTA at >= 2.5%).
 */

import { TV_RULES } from "./tv-legibility.ts";
import { ARCHETYPES, type ArchetypeId } from "./design-archetypes.ts";
import { measureText, wrapText, shortenDescription } from "./text-metrics.ts";

export const LAYOUT_RULES = {
  fillMin: 0.7,
  fillMax: 0.9,
  closingStripPct: 0.08,
  closingMinPct: 0.025,
  nameLeading: 1.15,
  descLeading: 1.2,
  minBottomFill: 0.75,
} as const;

export interface LayoutBlock {
  id: string;
  kind: "header" | "tagline" | "name" | "price" | "desc" | "closing" | "logo";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Colors actually painted, used by the contrast check. */
  fg: string;
  bg: string;
  fontSize: number;
}

export interface LaidDish {
  plato: string;
  precio: string;
  descripcion: string | null;
  lines: string[];
  y: number;
  h: number;
  column: number;
}

export interface PieceLayout {
  archetype: ArchetypeId;
  canvas: { w: number; h: number };
  margin: number;
  /** Region the dishes live in (photo band, right half or full canvas). */
  region: { x: number; y: number; w: number; h: number };
  columns: LaidDish[][];
  columnWidth: number;
  fonts: { header: number; tagline: number; name: number; price: number; desc: number; closing: number };
  showDescriptions: boolean;
  droppedDishes: number;
  blocks: LayoutBlock[];
  headerTitle: string;
  headerSubtitle: string;
  closingText: string;
  usePhoto: boolean;
  colors: { texto: string; precio: string; fondoTexto: string };
}

export interface LayoutInput {
  arquetipo?: ArchetypeId;
  background_color?: string;
  color_texto?: string;
  color_acento?: string;
  color_precio?: string;
  overlay_color?: string;
  overlay_opacity?: number;
  image_url?: string | null;
  fuente_titulo?: string;
  fuente_cuerpo?: string;
  header?: { nombre_restaurante?: string; tagline?: string; size?: number } | null;
  secciones?: { nombre?: string; items?: { plato?: string; descripcion?: string; precio?: string }[] }[] | null;
  footer_texto?: string | null;
  texto_principal?: string;
  texto_secundario?: string;
  logo_url?: string | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Even split: with an odd count the left column carries the extra dish. */
function splitEven<T>(items: T[], columns: number): T[][] {
  if (columns <= 1) return [items];
  const per = Math.ceil(items.length / columns);
  const out: T[][] = [];
  let index = 0;
  for (let c = 0; c < columns; c++) {
    const remaining = items.length - index;
    const take = c === columns - 1 ? remaining : Math.min(per, remaining);
    out.push(items.slice(index, index + take));
    index += take;
  }
  return out.filter((c) => c.length > 0);
}

export function buildPieceLayout(p: LayoutInput, canvasW: number, canvasH: number): PieceLayout {
  const archetype: ArchetypeId = p.arquetipo && ARCHETYPES[p.arquetipo] ? p.arquetipo : "lista_limpia";
  const spec = ARCHETYPES[archetype];
  const margin = Math.round(Math.min(canvasW, canvasH) * TV_RULES.safeMarginPct);
  const usableH = canvasH - margin * 2;
  const bodyFont = p.fuente_cuerpo || "Inter";
  const titleFont = p.fuente_titulo || "Oswald";
  const usePhoto = spec.usaFoto && !!p.image_url;

  // Region where the menu lives, per archetype.
  const region =
    archetype === "foto_protagonista"
      ? { x: margin, y: Math.round(canvasH * 0.42), w: canvasW - margin * 2, h: canvasH - margin - Math.round(canvasH * 0.42) }
      : archetype === "dividido"
        ? { x: Math.round(canvasW / 2) + margin, y: margin, w: Math.round(canvasW / 2) - margin * 2, h: usableH }
        : { x: margin, y: margin, w: canvasW - margin * 2, h: usableH };

  const rawDishes = (p.secciones ?? []).flatMap((s) =>
    (s.items ?? []).map((i) => ({
      plato: (i.plato ?? "").trim(),
      precio: (i.precio ?? "").trim(),
      descripcion: (i.descripcion ?? "").trim(),
    })),
  ).filter((d) => d.plato);

  const headerTitle = (p.header?.nombre_restaurante || p.texto_principal || "").trim();
  const headerSubtitle = (p.header?.tagline || p.texto_secundario || "").trim();
  const closingText = (p.footer_texto || "").trim();

  const headerSize = clamp(
    p.header?.size ?? Math.round(canvasH * TV_RULES.restauranteMinPct),
    Math.ceil(canvasH * TV_RULES.restauranteMinPct),
    Math.floor(canvasH * TV_RULES.restauranteMaxPct),
  );
  const taglineSize = Math.max(Math.ceil(canvasH * 0.026), Math.ceil(canvasH * TV_RULES.absoluteMinPct));
  const closingSize = Math.max(Math.ceil(canvasH * LAYOUT_RULES.closingMinPct), Math.ceil(canvasH * TV_RULES.absoluteMinPct));

  const headerH = archetype === "foto_protagonista" ? 0 : headerSize * 1.1 + (headerSubtitle ? taglineSize * 1.4 : 0) + canvasH * 0.02;
  const closingH = Math.round(canvasH * LAYOUT_RULES.closingStripPct);
  const dishesTop = region.y + headerH;
  const dishesBottom = region.y + region.h - (archetype === "foto_protagonista" ? 0 : closingH);
  const availableH = Math.max(canvasH * 0.2, dishesBottom - dishesTop);

  const minName = Math.ceil(canvasH * TV_RULES.minPlatoPct);
  const minDesc = Math.ceil(canvasH * TV_RULES.minDescripcionPct);

  let dishes = rawDishes.slice(0, spec.maxItems);
  let droppedDishes = rawDishes.length - dishes.length;
  let columnsCount = archetype === "lista_limpia" && dishes.length > 4 ? 2 : 1;
  let columnWidth = region.w / columnsCount - (columnsCount > 1 ? canvasW * 0.02 : 0);
  let nameSize = minName;
  let showDescriptions = false;
  let laidLines = new Map<string, string[]>();

  /** Tries a configuration; returns the total stacked height or null if names don't fit. */
  const attempt = (count: number, size: number, withDesc: boolean, cols: number) => {
    const colW = region.w / cols - (cols > 1 ? canvasW * 0.02 : 0);
    const lines = new Map<string, string[]>();
    let total = 0;
    const perColumn = splitEven(dishes.slice(0, count), cols);
    let tallestColumn = 0;

    for (const column of perColumn) {
      let colHeight = 0;
      for (const dish of column) {
        const priceW = measureText(dish.precio, size, bodyFont, 700) + size * 0.6;
        const nameW = colW - priceW;
        if (nameW < size * 3) return null;
        const wrapped = wrapText(dish.plato, nameW, size, bodyFont, 700, 2);
        if (!wrapped) return null;
        lines.set(dish.plato, wrapped);
        let h = wrapped.length * size * LAYOUT_RULES.nameLeading;
        if (withDesc && dish.descripcion) {
          const short = shortenDescription(dish.descripcion, colW, minDesc, bodyFont, 2);
          if (!short) return null;
          const dLines = wrapText(short, colW, minDesc, bodyFont, 400, 2) ?? [];
          h += dLines.length * minDesc * LAYOUT_RULES.descLeading + size * 0.25;
        }
        colHeight += h;
      }
      tallestColumn = Math.max(tallestColumn, colHeight);
    }
    total = tallestColumn;
    return { total, lines };
  };

  // 1) Try to keep every dish with descriptions, growing type to fill the space.
  let chosen: { count: number; size: number; withDesc: boolean; cols: number; lines: Map<string, string[]>; stack: number } | null = null;
  const anyDescription = dishes.some((d) => d.descripcion);

  outer: for (const withDesc of anyDescription ? [true, false] : [false]) {
    for (let count = dishes.length; count >= 1; count--) {
      const cols = archetype === "lista_limpia" && count > 4 ? 2 : 1;
      const rows = Math.ceil(count / cols);
      // Largest size that still fits the available height, never below the floor.
      const maxSize = Math.floor(availableH / Math.max(1, rows) / (withDesc ? 2.4 : 1.65));
      for (let size = Math.max(maxSize, minName); size >= minName; size -= 1) {
        const res = attempt(count, size, withDesc, cols);
        if (!res) continue;
        const gaps = Math.max(0, Math.ceil(count / cols) - 1);
        const stack = res.total + gaps * size * 0.45;
        if (stack <= availableH) {
          chosen = { count, size, withDesc, cols, lines: res.lines, stack };
          break outer;
        }
      }
    }
  }

  if (!chosen) {
    // Absolute fallback: fewest dishes at the minimum size, no descriptions.
    const cols = 1;
    const res = attempt(1, minName, false, cols);
    chosen = { count: 1, size: minName, withDesc: false, cols, lines: res?.lines ?? new Map(), stack: minName * 1.15 };
  }

  droppedDishes += dishes.length - chosen.count;
  dishes = dishes.slice(0, chosen.count);
  nameSize = chosen.size;
  showDescriptions = chosen.withDesc;
  columnsCount = chosen.cols;
  columnWidth = region.w / columnsCount - (columnsCount > 1 ? canvasW * 0.02 : 0);
  laidLines = chosen.lines;

  // 2) Distribute rows so the block fills 70-90% of the available height.
  const perColumn = splitEven(dishes, columnsCount);
  const columns: LaidDish[][] = [];
  const blocks: LayoutBlock[] = [];

  const overlayBg = p.background_color || "#000000";
  const textBg = overlayBg;
  const colorTexto = p.color_texto || "#ffffff";
  const colorPrecio = p.color_precio || p.color_acento || colorTexto;

  perColumn.forEach((column, colIndex) => {
    const rowHeights = column.map((dish) => {
      const lines = laidLines.get(dish.plato) ?? [dish.plato];
      let h = lines.length * nameSize * LAYOUT_RULES.nameLeading;
      if (showDescriptions && dish.descripcion) h += 2 * minDesc * LAYOUT_RULES.descLeading * 0.5 + nameSize * 0.25;
      return h;
    });
    const stack = rowHeights.reduce((a, b) => a + b, 0);
    const target = availableH * LAYOUT_RULES.fillMax;
    const gap = column.length > 1 ? clamp((target - stack) / (column.length - 1), nameSize * 0.35, nameSize * 2.2) : 0;
    let y = dishesTop;
    const laid: LaidDish[] = [];

    column.forEach((dish, i) => {
      const lines = laidLines.get(dish.plato) ?? [dish.plato];
      const h = rowHeights[i];
      const x = region.x + colIndex * (columnWidth + canvasW * 0.02);
      const desc = showDescriptions && dish.descripcion
        ? shortenDescription(dish.descripcion, columnWidth, minDesc, bodyFont, 2)
        : null;
      laid.push({ plato: dish.plato, precio: dish.precio, descripcion: desc, lines, y, h, column: colIndex });
      blocks.push({ id: `name-${colIndex}-${i}`, kind: "name", x, y, w: columnWidth * 0.62, h: lines.length * nameSize * LAYOUT_RULES.nameLeading, fg: colorTexto, bg: textBg, fontSize: nameSize });
      blocks.push({ id: `price-${colIndex}-${i}`, kind: "price", x: x + columnWidth * 0.64, y, w: columnWidth * 0.36, h: nameSize * LAYOUT_RULES.nameLeading, fg: colorPrecio, bg: textBg, fontSize: nameSize });
      if (desc) {
        blocks.push({ id: `desc-${colIndex}-${i}`, kind: "desc", x, y: y + lines.length * nameSize * LAYOUT_RULES.nameLeading, w: columnWidth, h: minDesc * LAYOUT_RULES.descLeading, fg: colorTexto, bg: textBg, fontSize: minDesc });
      }
      y += h + gap;
    });

    columns.push(laid);
  });

  if (headerTitle && archetype !== "foto_protagonista") {
    blocks.push({ id: "header", kind: "header", x: region.x, y: region.y, w: region.w, h: headerSize * 1.1, fg: colorTexto, bg: textBg, fontSize: headerSize });
  }
  if (headerTitle && archetype === "foto_protagonista") {
    blocks.push({ id: "header", kind: "header", x: margin, y: margin, w: canvasW - margin * 2, h: headerSize * 1.1, fg: colorTexto, bg: textBg, fontSize: headerSize });
  }
  if (closingText || p.logo_url) {
    blocks.push({
      id: "closing",
      kind: p.logo_url ? "logo" : "closing",
      x: region.x,
      y: canvasH - margin - closingSize * 1.2,
      w: region.w,
      h: closingSize * 1.2,
      fg: colorPrecio,
      bg: textBg,
      fontSize: closingSize,
    });
  }

  return {
    archetype,
    canvas: { w: canvasW, h: canvasH },
    margin,
    region,
    columns,
    columnWidth,
    fonts: { header: headerSize, tagline: taglineSize, name: nameSize, price: nameSize, desc: minDesc, closing: closingSize },
    showDescriptions,
    droppedDishes,
    blocks,
    headerTitle,
    headerSubtitle,
    closingText,
    usePhoto,
    colors: { texto: colorTexto, precio: colorPrecio, fondoTexto: textBg },
  };
}
