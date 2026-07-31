/**
 * Utilidades para servir imágenes de Supabase Storage con transformaciones.
 *
 * Storage expone un endpoint de render que redimensiona en el servidor:
 *   /storage/v1/object/public/<bucket>/<path>
 *   → /storage/v1/render/image/public/<bucket>/<path>?width=320&resize=cover&quality=70
 *
 * Así la grilla descarga miniaturas de ~20-40 KB en lugar del archivo original.
 */

const PUBLIC_OBJECT = "/storage/v1/object/public/";
const PUBLIC_RENDER = "/storage/v1/render/image/public/";

/** Formatos que el transformador de Storage NO procesa (se devuelven tal cual). */
const NON_TRANSFORMABLE = /\.(svg|gif)(\?|$)/i;

export interface ThumbOptions {
  width?: number;
  height?: number;
  resize?: "cover" | "contain" | "fill";
  quality?: number;
}

/**
 * Devuelve la URL de miniatura para una imagen pública de Supabase Storage.
 * Si la URL no es de Storage (o es un formato no transformable) la devuelve intacta.
 */
export function storageThumb(
  url: string | null | undefined,
  { width = 320, height, resize = "cover", quality = 70 }: ThumbOptions = {},
): string | undefined {
  if (!url) return undefined;
  if (!url.includes(PUBLIC_OBJECT)) return url;
  if (NON_TRANSFORMABLE.test(url)) return url;

  const [base] = url.split("?");
  const rendered = base.replace(PUBLIC_OBJECT, PUBLIC_RENDER);
  const params = new URLSearchParams();
  params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("resize", resize);
  params.set("quality", String(quality));
  return `${rendered}?${params.toString()}`;
}
