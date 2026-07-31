/**
 * Real text measurement.
 *
 * A proportional font makes "Hamburguesa con Champiñones" and
 * "IIIIIIIIIIIIIIIIIIIIIIIIIII" the same number of characters and very
 * different widths, so nothing here estimates by character count when a canvas
 * is available.
 */

type Metrics = (text: string, fontSizePx: number, fontFamily: string, weight?: number) => number;

let ctx: CanvasRenderingContext2D | null | undefined;

function getCtx(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx;
  try {
    const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
    ctx = canvas ? canvas.getContext("2d") : null;
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Fallback ratio (em per character) when no canvas exists — server side only. */
const FALLBACK_RATIO: Record<string, number> = {
  Oswald: 0.42,
  "Bebas Neue": 0.4,
  "Playfair Display": 0.52,
  Cormorant: 0.46,
  "Space Grotesk": 0.53,
  "DM Sans": 0.52,
  Inter: 0.53,
  Montserrat: 0.56,
  Roboto: 0.51,
};

export const measureText: Metrics = (text, fontSizePx, fontFamily, weight = 400) => {
  const value = text ?? "";
  if (!value) return 0;
  const c = getCtx();
  if (c) {
    c.font = `${weight} ${fontSizePx}px "${fontFamily}", sans-serif`;
    return c.measureText(value).width;
  }
  const ratio = FALLBACK_RATIO[fontFamily] ?? 0.52;
  return value.length * fontSizePx * ratio;
};

/**
 * Wraps text into at most `maxLines` lines without ever truncating a word.
 * Returns null when it does not fit — the caller must then reduce the number of
 * items or the font size, never cut the text.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSizePx: number,
  fontFamily: string,
  weight = 400,
  maxLines = 2,
): string[] | null {
  const words = (text ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, fontSizePx, fontFamily, weight) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    // A single word wider than the column can't be split: it does not fit.
    if (measureText(word, fontSizePx, fontFamily, weight) > maxWidth) return null;
    if (lines.length >= maxLines) return null;
  }
  if (current) lines.push(current);
  return lines.length <= maxLines ? lines : null;
}

/**
 * Shortens a description at a word boundary, with NO ellipsis. Returns null when
 * fewer than two useful words survive — in that case descriptions are dropped
 * from the whole piece.
 */
export function shortenDescription(
  text: string,
  maxWidth: number,
  fontSizePx: number,
  fontFamily: string,
  maxLines = 2,
): string | null {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const words = clean.split(" ");
  for (let count = words.length; count >= 2; count--) {
    const candidate = words.slice(0, count).join(" ");
    if (wrapText(candidate, maxWidth, fontSizePx, fontFamily, 400, maxLines)) return candidate;
  }
  return null;
}
