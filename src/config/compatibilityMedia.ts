/**
 * compatibilityMedia.ts — clips de la sección "¿Sirve mi televisor?".
 *
 * Los archivos viven en Supabase Storage (bucket `media`, carpeta `landing/`),
 * NUNCA en public/ ni en el repositorio. Subí cada clip en WebM (principal) y
 * MP4 (respaldo), sin pista de audio, y dejá acá el nombre del archivo.
 *
 * Si un clip todavía no está subido, dejá el nombre en null: la sección muestra
 * un marcador y no pide nada a la red.
 */
import type { InlineVideoSource } from "@/components/media/InlineVideo";

const BUCKET_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/landing`;

export interface ClipConfig {
  /** Nombre base del archivo, sin extensión. null = todavía no subido. */
  file: string | null;
  /** Imagen de portada opcional (misma carpeta). */
  poster?: string | null;
}

export const COMPAT_CLIPS = {
  dispositivo: { file: null, poster: null } as ClipConfig,
  paso1: { file: null, poster: null } as ClipConfig,
  paso2: { file: null, poster: null } as ClipConfig,
  paso3: { file: null, poster: null } as ClipConfig,
};

export function clipSources(clip: ClipConfig): InlineVideoSource[] {
  if (!clip.file) return [];
  return [
    { src: `${BUCKET_BASE}/${clip.file}.webm`, type: "video/webm" },
    { src: `${BUCKET_BASE}/${clip.file}.mp4`, type: "video/mp4" },
  ];
}

export function clipPoster(clip: ClipConfig): string | undefined {
  return clip.poster ? `${BUCKET_BASE}/${clip.poster}` : undefined;
}
