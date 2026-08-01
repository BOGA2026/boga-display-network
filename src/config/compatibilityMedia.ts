/**
 * compatibilityMedia.ts — clips de la sección "¿Sirve mi televisor?".
 *
 * Los archivos NUNCA viven en public/ ni en el repositorio: se sirven desde
 * CDN mediante punteros `.asset.json` (o desde Supabase Storage cuando la
 * cuenta tenga permiso de subida al bucket `media/landing`).
 *
 * Cada clip lleva WebM (VP9) primero y MP4 (H.264) de respaldo, sin pista de
 * audio. Si un clip todavía no existe, dejá `sources: []`: la secuencia lo
 * salta sin romperse.
 */
import type { InlineVideoSource } from "@/components/media/InlineVideo";

import dispositivoWebm from "@/assets/landing/dispositivo.webm.asset.json";
import dispositivoMp4 from "@/assets/landing/dispositivo.mp4.asset.json";
import dispositivoPoster from "@/assets/landing/dispositivo.jpg.asset.json";
import paso1Webm from "@/assets/landing/paso1.webm.asset.json";
import paso1Mp4 from "@/assets/landing/paso1.mp4.asset.json";
import paso2Webm from "@/assets/landing/paso2.webm.asset.json";
import paso2Mp4 from "@/assets/landing/paso2.mp4.asset.json";
import paso3Webm from "@/assets/landing/paso3.webm.asset.json";
import paso3Mp4 from "@/assets/landing/paso3.mp4.asset.json";

export interface ClipConfig {
  sources: InlineVideoSource[];
  poster?: string;
}

const pair = (webm: { url: string }, mp4: { url: string }): InlineVideoSource[] => [
  { src: webm.url, type: "video/webm" },
  { src: mp4.url, type: "video/mp4" },
];

export const COMPAT_CLIPS: Record<
  "dispositivo" | "paso1" | "paso2" | "paso3",
  ClipConfig
> = {
  dispositivo: {
    sources: pair(dispositivoWebm, dispositivoMp4),
    poster: dispositivoPoster.url,
  },
  paso1: { sources: pair(paso1Webm, paso1Mp4) },
  paso2: { sources: pair(paso2Webm, paso2Mp4) },
  paso3: { sources: pair(paso3Webm, paso3Mp4) },
};

export function clipSources(clip: ClipConfig): InlineVideoSource[] {
  return clip.sources;
}

export function clipPoster(clip: ClipConfig): string | undefined {
  return clip.poster;
}
