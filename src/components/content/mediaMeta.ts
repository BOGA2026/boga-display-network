/**
 * Utilidades de metadatos para la biblioteca de contenido.
 * Las dimensiones no viven en la base: se miden al cargar la miniatura.
 */

export type Orientation = "horizontal" | "vertical" | "cuadrada";

export interface MediaDims {
  width: number;
  height: number;
}

export const TYPE_LABELS: Record<string, string> = {
  image: "Imagen",
  video: "Video",
  layout: "Diseño",
  menu: "Menú",
  html: "HTML",
  audio: "Audio",
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function orientationOf(dims?: MediaDims | null): Orientation | null {
  if (!dims || !dims.width || !dims.height) return null;
  const ratio = dims.width / dims.height;
  if (ratio > 1.05) return "horizontal";
  if (ratio < 0.95) return "vertical";
  return "cuadrada";
}

/** Chip corto de proporción: "16:9", "9:16", "1:1". */
export function ratioLabel(dims?: MediaDims | null): string | null {
  const o = orientationOf(dims);
  if (!o) return null;
  if (o === "cuadrada") return "1:1";
  return o === "horizontal" ? "16:9" : "9:16";
}

export function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m}:${String(s).padStart(2, "0")} min` : `${m} min`;
}

export function formatDims(dims?: MediaDims | null): string | null {
  if (!dims) return null;
  return `${dims.width}×${dims.height}`;
}

/** Fecha relativa en español colombiano: "hace 11 días". */
export function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `hace ${mo} ${mo === 1 ? "mes" : "meses"}`;
  const y = Math.round(mo / 12);
  return `hace ${y} ${y === 1 ? "año" : "años"}`;
}

/** Metadata compacta del pie de tarjeta, separada por puntos medios. */
export function metaLine(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}

/* ------------------------------------------------------------------ *
 * Peso del archivo
 * ------------------------------------------------------------------ */

/** Tope duro de subida: por encima de esto el reproductor de la pantalla sufre. */
export const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
/** A partir de aquí advertimos: en WiFi de local puede tardar en cargar. */
export const HEAVY_FILE_BYTES = 100 * 1024 * 1024;

export const HEAVY_FILE_TOOLTIP =
  "Archivo pesado. En pantallas con conexión lenta puede tardar en cargar.";

export function isHeavyFile(bytes?: number | null): boolean {
  return typeof bytes === "number" && bytes >= HEAVY_FILE_BYTES;
}

/** "2,4 MB" / "180 MB" — formato colombiano, coma decimal. */
export function formatBytes(bytes?: number | null): string | null {
  if (typeof bytes !== "number" || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (mb < 10) return `${mb.toFixed(1).replace(".", ",")} MB`;
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1).replace(".", ",")} GB`;
}
