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

/* ─────────────── Versiones del logo ─────────────── */

async function cargarImagen(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No pudimos leer la imagen del logo"));
  });
  return img;
}

function dibujar(img: HTMLImageElement, maxLado = 1024) {
  const w = img.naturalWidth || 512;
  const h = img.naturalHeight || 512;
  const escala = Math.min(1, maxLado / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * escala));
  canvas.height = Math.max(1, Math.round(h * escala));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Sin canvas");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/**
 * Quita el fondo plano del logo (el típico recuadro blanco) mirando las cuatro
 * esquinas. Si las esquinas no coinciden entre sí, se asume que el fondo es
 * parte del diseño y no se toca nada.
 */
function quitarFondoPlano(data: Uint8ClampedArray, w: number, h: number): boolean {
  const px = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]] as const;
  };
  const esquinas = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
  if (esquinas.some((c) => c[3] < 200)) return false; // ya es transparente
  const [r0, g0, b0] = esquinas[0];
  const parecidas = esquinas.every(
    (c) => Math.abs(c[0] - r0) + Math.abs(c[1] - g0) + Math.abs(c[2] - b0) < 40,
  );
  if (!parecidas) return false;
  const tol = 46;
  for (let i = 0; i < data.length; i += 4) {
    const d =
      Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0);
    if (d < tol) data[i + 3] = 0;
  }
  return true;
}

function aBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No pudimos generar el PNG"))), "image/png"),
  );
}

export interface LogoVariants {
  /** Logo a color con el fondo plano recortado. */
  transparente: Blob;
  /** Monocromo claro, para poner sobre fondos oscuros. */
  claro: Blob;
  /** Monocromo oscuro, para poner sobre fondos claros. */
  oscuro: Blob;
  /** true si hubo que recortarle un fondo opaco al original. */
  recorto: boolean;
}

/** Genera las versiones clara y oscura a partir del logo principal. */
export async function deriveLogoVariants(src: string): Promise<LogoVariants> {
  const img = await cargarImagen(src);
  const { canvas, ctx } = dibujar(img);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const recorto = quitarFondoPlano(imgData.data, canvas.width, canvas.height);
  ctx.putImageData(imgData, 0, 0);
  const transparente = await aBlob(canvas);

  const monocromo = async (r: number, g: number, b: number) => {
    const c2 = document.createElement("canvas");
    c2.width = canvas.width;
    c2.height = canvas.height;
    const ctx2 = c2.getContext("2d");
    if (!ctx2) throw new Error("Sin canvas");
    const copia = ctx2.createImageData(canvas.width, canvas.height);
    copia.data.set(imgData.data);
    for (let i = 0; i < copia.data.length; i += 4) {
      if (copia.data[i + 3] === 0) continue;
      copia.data[i] = r;
      copia.data[i + 1] = g;
      copia.data[i + 2] = b;
    }
    ctx2.putImageData(copia, 0, 0);
    return aBlob(c2);
  };

  return {
    transparente,
    claro: await monocromo(255, 255, 255),
    oscuro: await monocromo(17, 17, 17),
    recorto,
  };
}

/** Paleta a partir de un archivo local: evita depender de CORS del bucket. */
export async function extractPaletteFromFile(file: File, max = 5): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    return await extractPalette(url, max);
  } finally {
    URL.revokeObjectURL(url);
  }
}
