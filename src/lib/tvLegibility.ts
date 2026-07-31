/**
 * TV legibility rules for digital signage pieces.
 * Pieces are read from 3-5 m away, so typography is sized as a percentage of
 * the CANVAS HEIGHT, never in "editorial" desktop point sizes.
 */

export const TV_RULES = {
  /** Minimum sizes as a fraction of canvas height. */
  minPlatoPct: 0.04,
  minPrecioPct: 0.04,
  minDescripcionPct: 0.022,
  restauranteMinPct: 0.06,
  restauranteMaxPct: 0.08,
  absoluteMinPct: 0.02,
  /** Max dishes per piece — beyond this the eye can't scan the screen in time. */
  maxItems: 7,
  /** Description never wraps beyond 2 lines. */
  maxDescLines: 2,
  /** Minimum text/background contrast ratio. */
  minContrast: 7,
  /** Overscan safe margin on every edge. */
  safeMarginPct: 0.05,
  /** Minimum darkening layer when text sits over a photo. */
  minOverlayOpacity: 0.6,
} as const;

export interface TvTypography {
  restaurante: number;
  seccion: number;
  plato: number;
  precio: number;
  descripcion: number;
  tagline: number;
  footer: number;
  safeMargin: number;
  maxDescChars: number;
}

/** Computes concrete pixel sizes for a canvas height, always above the minimums. */
export function tvTypography(canvasHeight: number, canvasWidth = canvasHeight * 16 / 9): TvTypography {
  const h = Math.max(1, canvasHeight);
  const plato = Math.round(h * TV_RULES.minPlatoPct);
  const precio = Math.round(h * TV_RULES.minPrecioPct);
  const descripcion = Math.round(h * TV_RULES.minDescripcionPct);
  const restaurante = Math.round(h * TV_RULES.restauranteMinPct);
  const safeMargin = Math.round(Math.min(canvasWidth, h) * TV_RULES.safeMarginPct);
  // Rough char budget for 2 lines inside a single column.
  const columnWidth = canvasWidth / 2 - safeMargin * 1.5;
  const charsPerLine = Math.max(12, Math.floor(columnWidth / (descripcion * 0.52)));
  return {
    restaurante,
    seccion: Math.max(Math.round(h * TV_RULES.absoluteMinPct), Math.round(descripcion * 1.05)),
    plato,
    precio,
    descripcion,
    tagline: Math.max(Math.round(h * 0.026), Math.round(h * TV_RULES.absoluteMinPct)),
    footer: Math.round(h * TV_RULES.absoluteMinPct),
    safeMargin,
    maxDescChars: charsPerLine * TV_RULES.maxDescLines,
  };
}

// ─── Contrast helpers (WCAG relative luminance) ───

export function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || "").replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full.slice(0, 6) || "000000", 16);
  if (!Number.isFinite(int)) return [0, 0, 0];
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function luminance([r, g, b]: [number, number, number]) {
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(hexToRgb(fg));
  const l2 = luminance(hexToRgb(bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Blends an overlay color over a base color at a given opacity. */
export function blend(base: string, overlay: string, opacity: number): string {
  const b = hexToRgb(base);
  const o = hexToRgb(overlay);
  const a = Math.min(1, Math.max(0, opacity));
  const mix = b.map((v, i) => Math.round(v * (1 - a) + o[i] * a));
  return `#${mix.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Truncates a description so it never exceeds 2 lines at the minimum size. */
export function clampDescription(text: string, maxChars: number): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars * 0.5 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export interface TvViolation {
  proposalId: number | string;
  rule: string;
  detail: string;
}

export interface LooseProposal {
  id?: number | string;
  color_texto?: string;
  color_acento?: string;
  background_color?: string;
  overlay_color?: string;
  overlay_opacity?: number;
  image_url?: string | null;
  header?: { nombre_restaurante?: string; tagline?: string; size?: number } | null;
  secciones?: { nombre?: string; items?: { plato?: string; descripcion?: string; precio?: string }[] }[] | null;
  titulo_size?: number;
  subtitulo_size?: number;
}

/** Effective background a text sits on, accounting for the darkening overlay. */
export function effectiveBackground(p: LooseProposal): string {
  const base = p.background_color || "#000000";
  const overlay = p.overlay_color || "#000000";
  const opacity = typeof p.overlay_opacity === "number" ? p.overlay_opacity : 0;
  return p.image_url || opacity > 0 ? blend(base, overlay, Math.max(opacity, p.image_url ? TV_RULES.minOverlayOpacity : opacity)) : base;
}

/** Read-only check: returns every rule the proposal breaks. */
export function validateTvProposal(p: LooseProposal, canvasHeight: number, canvasWidth?: number): TvViolation[] {
  const t = tvTypography(canvasHeight, canvasWidth);
  const id = p.id ?? "?";
  const v: TvViolation[] = [];

  const totalItems = (p.secciones || []).reduce((n, s) => n + (s.items?.length ?? 0), 0);
  if (totalItems > TV_RULES.maxItems) {
    v.push({ proposalId: id, rule: "max_items", detail: `${totalItems} platos (máximo ${TV_RULES.maxItems})` });
  }

  const headerSize = p.header?.size ?? 0;
  if (p.secciones?.length && (headerSize < canvasHeight * TV_RULES.restauranteMinPct || headerSize > canvasHeight * TV_RULES.restauranteMaxPct)) {
    v.push({ proposalId: id, rule: "header_size", detail: `nombre del negocio en ${headerSize}px, requerido ${Math.round(canvasHeight * TV_RULES.restauranteMinPct)}-${Math.round(canvasHeight * TV_RULES.restauranteMaxPct)}px` });
  }

  for (const s of p.secciones || []) {
    for (const item of s.items || []) {
      if (!item.precio) {
        v.push({ proposalId: id, rule: "missing_price", detail: `${item.plato ?? "plato"} sin precio` });
      }
      if ((item.descripcion || "").length > t.maxDescChars) {
        v.push({ proposalId: id, rule: "desc_too_long", detail: `descripción de "${item.plato}" excede 2 líneas` });
      }
      if (/\.{4,}|·{3,}|-{4,}|_{4,}/.test(`${item.plato ?? ""}${item.precio ?? ""}`)) {
        v.push({ proposalId: id, rule: "dotted_leader", detail: `línea punteada entre plato y precio en "${item.plato}"` });
      }
    }
  }

  const bg = effectiveBackground(p);
  const textRatio = contrastRatio(p.color_texto || "#ffffff", bg);
  if (textRatio < TV_RULES.minContrast) {
    v.push({ proposalId: id, rule: "contrast", detail: `contraste texto/fondo ${textRatio.toFixed(1)}:1 (mínimo ${TV_RULES.minContrast}:1)` });
  }
  const accentRatio = contrastRatio(p.color_acento || "#ffffff", bg);
  if (accentRatio < TV_RULES.minContrast) {
    v.push({ proposalId: id, rule: "contrast_accent", detail: `contraste precio/fondo ${accentRatio.toFixed(1)}:1` });
  }
  if (p.image_url && (p.overlay_opacity ?? 0) < TV_RULES.minOverlayOpacity) {
    v.push({ proposalId: id, rule: "overlay", detail: `texto sobre foto con oscurecimiento ${(p.overlay_opacity ?? 0) * 100}% (mínimo 60%)` });
  }

  return v;
}

/** Best-effort repair so a proposal complies with the TV rules. */
export function enforceTvProposal<T extends LooseProposal>(p: T, canvasHeight: number, canvasWidth?: number): T {
  const t = tvTypography(canvasHeight, canvasWidth);
  const out: LooseProposal & Record<string, unknown> = { ...p } as any;

  // 1. Overlay: no text over a photo without a 60% darkening layer.
  if (out.image_url) {
    out.overlay_opacity = Math.max(out.overlay_opacity ?? 0, TV_RULES.minOverlayOpacity);
  }

  // 2. Fewer dishes rather than smaller type.
  if (Array.isArray(out.secciones)) {
    let budget = TV_RULES.maxItems;
    out.secciones = out.secciones
      .map((s) => {
        const items = (s.items || []).slice(0, Math.max(0, budget)).map((item) => ({
          ...item,
          descripcion: clampDescription(item.descripcion || "", t.maxDescChars),
          // Never a long dotted leader between dish and price.
          plato: (item.plato || "").replace(/[\s.·_-]{4,}$/, "").trim(),
          precio: (item.precio || "").replace(/^[\s.·_-]{4,}/, "").trim(),
        }));
        budget -= items.length;
        return { ...s, items };
      })
      .filter((s) => (s.items?.length ?? 0) > 0);
  }

  // 3. Typography floors.
  out.header = {
    nombre_restaurante: out.header?.nombre_restaurante ?? "",
    tagline: out.header?.tagline ?? "",
    size: Math.min(
      Math.round(canvasHeight * TV_RULES.restauranteMaxPct),
      Math.max(Math.round(canvasHeight * TV_RULES.restauranteMinPct), out.header?.size ?? 0),
    ),
  };
  out.titulo_size = Math.max(out.titulo_size ?? 0, Math.round(canvasHeight * TV_RULES.restauranteMinPct));
  out.subtitulo_size = Math.max(out.subtitulo_size ?? 0, t.plato);
  (out as Record<string, unknown>).tv_typography = t;

  // 4. Contrast: pick the readable text color, then deepen the overlay if needed.
  const pickReadable = (color: string, bg: string) => {
    if (contrastRatio(color, bg) >= TV_RULES.minContrast) return color;
    const white = contrastRatio("#ffffff", bg);
    const black = contrastRatio("#000000", bg);
    return white >= black ? "#ffffff" : "#111111";
  };
  let bg = effectiveBackground(out);
  let guard = 0;
  while (contrastRatio(pickReadable(out.color_texto || "#ffffff", bg), bg) < TV_RULES.minContrast && guard < 8) {
    out.overlay_opacity = Math.min(0.92, (out.overlay_opacity ?? TV_RULES.minOverlayOpacity) + 0.06);
    bg = effectiveBackground(out);
    guard++;
  }
  out.color_texto = pickReadable(out.color_texto || "#ffffff", bg);
  out.color_acento = contrastRatio(out.color_acento || "#ffffff", bg) >= TV_RULES.minContrast
    ? out.color_acento
    : out.color_texto;

  return out as T;
}

/** Caps a menu to 7 dishes and clamps descriptions to 2 lines. */
export function clampMenuSections(
  secciones: { nombre?: string; items?: { plato?: string; descripcion?: string; precio?: string }[] }[],
  maxDescChars: number,
) {
  let budget = TV_RULES.maxItems;
  return secciones
    .map((s) => {
      const items = (s.items || []).slice(0, Math.max(0, budget)).map((item) => ({
        ...item,
        plato: (item.plato || "").replace(/[\s.·_-]{4,}$/, "").trim(),
        precio: (item.precio || "").replace(/^[\s.·_-]{4,}/, "").trim(),
        descripcion: clampDescription(item.descripcion || "", maxDescChars),
      }));
      budget -= items.length;
      return { ...s, nombre: s.nombre ?? "", items };
    })
    .filter((s) => s.items.length > 0);
}
