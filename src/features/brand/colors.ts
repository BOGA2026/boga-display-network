/**
 * Colores de la marca: extracción desde el logo y chequeo de contraste.
 *
 * La extracción corre en el navegador sobre un canvas de 64 px: no necesita
 * servicio externo y basta para proponer 4-5 colores dominantes.
 */
import { contrastRatio } from "@/lib/tvLegibility";

export { contrastRatio };

/** Mínimo para que un texto se lea en un televisor a cuatro metros. */
export const MIN_TV_CONTRAST = 7;

export function isHex(value: string): boolean {
  return /^#([0-9a-f]{6})$/i.test(value.trim());
}

export function normalizeHex(value: string): string {
  let v = value.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  if (/^#([0-9a-f]{3})$/i.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return v.toUpperCase();
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function distance(a: string, b: string) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Devuelve hasta `max` colores dominantes de una imagen (logo).
 * Ignora píxeles transparentes y casi blancos/negros puros, que suelen ser
 * fondo o sombra y no dicen nada de la marca.
 */
export async function extractPalette(src: string, max = 5): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No pudimos leer el logo"));
  });

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 160) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max3 = Math.max(r, g, b);
    const min3 = Math.min(r, g, b);
    const gris = max3 - min3 < 18;
    if (gris && (max3 > 235 || max3 < 25)) continue; // blanco/negro de fondo
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const prev = buckets.get(key);
    if (prev) {
      prev.count++;
      prev.r += r;
      prev.g += g;
      prev.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  const ordenados = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .map((b) => toHex(Math.round(b.r / b.count), Math.round(b.g / b.count), Math.round(b.b / b.count)));

  const out: string[] = [];
  for (const c of ordenados) {
    if (out.length >= max) break;
    if (out.every((prev) => distance(prev, c) > 48)) out.push(c);
  }
  return out;
}
