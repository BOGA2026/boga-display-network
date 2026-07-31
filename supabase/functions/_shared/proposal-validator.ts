/**
 * validarPropuesta(): the gate every AI proposal must pass BETWEEN the model
 * response and the render. Nothing reaches the canvas without going through
 * here, and every failure is logged with the value the model actually returned
 * so the prompt can be tuned with real data.
 */

import { TV_RULES, contrastRatio, blend } from "./tv-legibility.ts";
import { ARCHETYPES, type ArchetypeId } from "./design-archetypes.ts";
import { buildPieceLayout, LAYOUT_RULES, type LayoutInput, type PieceLayout } from "./piece-layout.ts";

export const OVERLAY_RANGE = { min: 0.45, max: 0.65, hardMax: 0.7 } as const;

export interface RuleViolation {
  regla: string;
  detalle: string;
  valor?: string | number;
}

export interface ValidationResult {
  ok: boolean;
  violaciones: RuleViolation[];
  layout: PieceLayout;
}

// ─── System colors are reserved for state, never for decoration ───

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = (hex || "").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.slice(0, 6);
  const n = parseInt(full || "000000", 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  return { h: (h + 360) % 360, s, l };
}

/** true when the color reads as error (red), success (green) or warning (amber). */
export function isSystemStateColor(hex: string): false | "rojo" | "verde" | "ambar" {
  const { h, s, l } = hexToHsl(hex);
  if (s < 0.3 || l < 0.15 || l > 0.85) return false;
  if (h <= 18 || h >= 342) return "rojo";
  if (h >= 24 && h <= 62) return "ambar";
  if (h >= 80 && h <= 165) return "verde";
  return false;
}

/**
 * Single rule for the whole app: the price uses the brand accent, or pure white
 * when the accent doesn't reach 7:1 over its background. Never red, green or amber.
 */
export function resolvePriceColor(accent: string | undefined, background: string): string {
  const candidate = accent && !isSystemStateColor(accent) ? accent : "";
  if (candidate && contrastRatio(candidate, background) >= TV_RULES.minContrast) return candidate;
  return contrastRatio("#ffffff", background) >= contrastRatio("#111111", background) ? "#ffffff" : "#111111";
}

/** Effective background painted behind a text block (photo + darkening band). */
export function paintedBackground(p: LayoutInput): string {
  const base = p.background_color || "#000000";
  if (!p.image_url) return base;
  const overlay = p.overlay_color || "#000000";
  const opacity = Math.min(OVERLAY_RANGE.hardMax, Math.max(OVERLAY_RANGE.min, p.overlay_opacity ?? OVERLAY_RANGE.min));
  return blend(base, overlay, opacity);
}

/**
 * Normalizes what the model returned before anything is rendered:
 * - oscurecimiento clamped to 0.45-0.65 (above 0.7 the photo stops contributing)
 * - a photo archetype with no usable image falls back to "lista_limpia" over a
 *   solid brand background instead of rendering a black rectangle
 * - the price color follows the single app-wide rule
 */
export function normalizeProposalVisuals<T extends LayoutInput & Record<string, any>>(
  p: T,
  brand?: { primary?: string | null; accent?: string | null; secondary?: string | null; logo_url?: string | null },
): T {
  const out: Record<string, any> = { ...p };
  const archetype: ArchetypeId = out.arquetipo && ARCHETYPES[out.arquetipo] ? out.arquetipo : "lista_limpia";
  const spec = ARCHETYPES[archetype];

  if (spec.usaFoto) {
    if (!out.image_url) {
      // Never a failed photo: a well-resolved solid background always looks intentional.
      out.arquetipo = "lista_limpia";
      out.tipo_layout = "lista_limpia";
      out.fallback_de = archetype;
      out.overlay_opacity = 0;
      out.background_color = brand?.secondary || out.background_color || "#101014";
      out.fuente_titulo = ARCHETYPES.lista_limpia.fuenteTitulo;
      out.fuente_cuerpo = ARCHETYPES.lista_limpia.fuenteCuerpo;
    } else {
      out.overlay_opacity = Math.min(
        OVERLAY_RANGE.max,
        Math.max(OVERLAY_RANGE.min, typeof out.overlay_opacity === "number" ? out.overlay_opacity : OVERLAY_RANGE.min),
      );
    }
  } else {
    out.overlay_opacity = 0;
    out.image_url = null;
  }

  if (brand?.logo_url && !out.logo_url) out.logo_url = brand.logo_url;

  const bg = paintedBackground(out as LayoutInput);
  const accent = brand?.accent || brand?.primary || out.color_acento;
  out.color_acento = accent && !isSystemStateColor(accent) ? accent : resolvePriceColor(accent, bg);
  out.color_precio = resolvePriceColor(out.color_acento, bg);

  return out as T;
}

/** Axis-aligned overlap test with a 1px tolerance. */
const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x + a.w > b.x + 1 && b.x + b.w > a.x + 1 && a.y + a.h > b.y + 1 && b.y + b.h > a.y + 1;

export function validarPropuesta(spec: LayoutInput, canvasW: number, canvasH: number): ValidationResult {
  const v: RuleViolation[] = [];
  const layout = buildPieceLayout(spec, canvasW, canvasH);
  const pct = (px: number) => (px / canvasH) * 100;
  const bg = paintedBackground(spec);

  // 1-3. Typography floors.
  if (pct(layout.fonts.name) < TV_RULES.minPlatoPct * 100 - 0.01) {
    v.push({ regla: "tamano_nombre_pct", detalle: "nombre del plato por debajo del 4% de la altura", valor: +pct(layout.fonts.name).toFixed(2) });
  }
  if (pct(layout.fonts.price) < TV_RULES.minPrecioPct * 100 - 0.01) {
    v.push({ regla: "tamano_precio_pct", detalle: "precio por debajo del 4% de la altura", valor: +pct(layout.fonts.price).toFixed(2) });
  }
  if (layout.showDescriptions && pct(layout.fonts.desc) < TV_RULES.minDescripcionPct * 100 - 0.01) {
    v.push({ regla: "tamano_descripcion_pct", detalle: "descripción por debajo del 2,2%: debe eliminarse de toda la pieza", valor: +pct(layout.fonts.desc).toFixed(2) });
  }

  // 4. Business name between 6% and 8%.
  const headerPct = pct(layout.fonts.header);
  if (layout.headerTitle && (headerPct < 6 - 0.01 || headerPct > 8 + 0.01)) {
    v.push({ regla: "tamano_negocio_pct", detalle: "el nombre del negocio debe medir entre 6% y 8% de la altura", valor: +headerPct.toFixed(2) });
  }

  // 5. Real computed contrast, not the one the model declares.
  for (const block of layout.blocks) {
    const ratio = contrastRatio(block.fg, block.kind === "price" ? bg : block.bg || bg);
    if (ratio < TV_RULES.minContrast) {
      v.push({ regla: "contraste", detalle: `${block.kind} con contraste ${ratio.toFixed(1)}:1 (mínimo 7:1)`, valor: +ratio.toFixed(2) });
      break;
    }
  }

  // 6. Safe margin (overscan).
  const safe = { x: layout.margin, y: layout.margin, w: canvasW - layout.margin * 2, h: canvasH - layout.margin * 2 };
  for (const b of layout.blocks) {
    if (b.x < safe.x - 1 || b.y < safe.y - 1 || b.x + b.w > safe.x + safe.w + 1 || b.y + b.h > safe.y + safe.h + 1) {
      v.push({ regla: "margen_seguridad", detalle: `el bloque ${b.id} se sale del margen de seguridad del 5%` });
      break;
    }
  }

  // 7. No overlapping blocks.
  for (let i = 0; i < layout.blocks.length; i++) {
    for (let j = i + 1; j < layout.blocks.length; j++) {
      if (overlaps(layout.blocks[i], layout.blocks[j])) {
        v.push({ regla: "solapamiento", detalle: `${layout.blocks[i].id} se solapa con ${layout.blocks[j].id}` });
        i = layout.blocks.length;
        break;
      }
    }
  }

  // 8. Price color: never a system state color.
  const stateColor = isSystemStateColor(spec.color_precio || spec.color_acento || "");
  if (stateColor) {
    v.push({ regla: "color_precio", detalle: `el precio usa ${stateColor}, reservado para estados del sistema`, valor: spec.color_precio || spec.color_acento });
  }

  // 9. Vertical occupation: the piece must not leave the bottom third empty.
  const dishBlocks = layout.blocks.filter((b) => b.kind === "name" || b.kind === "desc" || b.kind === "price");
  if (dishBlocks.length) {
    const lowest = Math.max(...dishBlocks.map((b) => b.y + b.h));
    const fill = (lowest - layout.margin) / (canvasH - layout.margin * 2);
    if (fill < LAYOUT_RULES.minBottomFill) {
      v.push({ regla: "ocupacion_vertical", detalle: "el contenido termina antes del 75% de la altura útil", valor: +(fill * 100).toFixed(1) });
    }
  }

  return { ok: v.length === 0, violaciones: v, layout };
}

/** Console trace so the prompt can be tuned with real data. */
export function logViolations(intento: number, id: number | string, violaciones: RuleViolation[]) {
  if (!violaciones.length) return;
  console.warn(
    `[validarPropuesta] intento ${intento} · propuesta ${id} · ${violaciones.length} reglas incumplidas`,
    violaciones.map((x) => `${x.regla}=${x.valor ?? "-"} (${x.detalle})`),
  );
}
