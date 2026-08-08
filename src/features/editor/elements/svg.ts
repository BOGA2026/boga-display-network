/**
 * Utilidades para los elementos gráficos del editor.
 * Todo se dibuja en SVG monocromo con trazo grueso (legible a 4 metros)
 * y toma el color de acento de "Tu marca" al insertarse.
 */

export type ElementColors = {
  /** Color de acento de la marca (trazo principal). */
  accent: string;
  /** Color primario de la marca. */
  primary: string;
  /** Color secundario de la marca. */
  secondary: string;
};

export const DEFAULT_ELEMENT_COLORS: ElementColors = {
  accent: "#F59E0B",
  primary: "#7C3AED",
  secondary: "#EC4899",
};

/** Grosor mínimo de trazo para lectura a distancia. */
export const STROKE = 7;

const esc = (s: string) => s.replace(/#/g, "%23").replace(/"/g, "'").replace(/\n/g, " ").replace(/\s{2,}/g, " ");

/** Envuelve el contenido en un SVG de trazo grueso. */
export function strokeSvg(inner: string, opts?: { box?: number; width?: number }) {
  const box = opts?.box ?? 100;
  const w = opts?.width ?? STROKE;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" fill="none" stroke="__C__" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

/** Envuelve contenido libre (formas rellenas, textos, patrones). */
export function rawSvg(inner: string, vb: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;
}

/** Reemplaza los tokens de color y devuelve un data URI listo para <img>. */
export function toDataUri(svg: string, colors: ElementColors) {
  const filled = svg
    .replace(/__C__/g, colors.accent)
    .replace(/__P__/g, colors.primary)
    .replace(/__S__/g, colors.secondary);
  return `data:image/svg+xml;utf8,${esc(filled)}`;
}

/** Texto centrado dentro de un SVG (para insignias y fichas). */
export function centeredText(
  text: string,
  opts: { x: number; y: number; size: number; fill?: string; weight?: number; letter?: number; anchor?: string },
) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<text x="${opts.x}" y="${opts.y}" text-anchor="${opts.anchor ?? "middle"}" dominant-baseline="middle" font-family="Montserrat, Inter, Arial, sans-serif" font-weight="${opts.weight ?? 800}" font-size="${opts.size}" letter-spacing="${opts.letter ?? 1}" fill="${opts.fill ?? "__C__"}">${safe}</text>`;
}
