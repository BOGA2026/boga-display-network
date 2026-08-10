/**
 * video-metadata.ts — todo se saca en el navegador, antes de subir.
 *
 * El navegador ya sabe decodificar el video: no hace falta ffmpeg ni una
 * edge function. Con un <video> sobre un object URL salen duración y
 * dimensiones reales, y con un seek + canvas sale la miniatura.
 *
 * Dos detalles que hacen la diferencia:
 *  - No se captura el segundo 0: casi toda pieza de restaurante arranca con
 *    fundido desde negro y la miniatura quedaría inservible.
 *  - Se espera el evento `seeked` antes de dibujar. Si se dibuja apenas se
 *    asigna `currentTime`, el frame todavía no se decodificó y el canvas sale
 *    negro. Es el error clásico de este patrón.
 */

export interface VideoMetadata {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  thumbnailBlob: Blob | null;
  thumbnailType: string | null;
}

export interface ImageMetadata {
  width: number | null;
  height: number | null;
}

/** Marco de la miniatura: 16:9, el mismo de las tarjetas. */
export const THUMB_WIDTH = 480;
export const THUMB_HEIGHT = 270;

/** Tope de paciencia. Pasado esto la subida sigue sin miniatura. */
export const EXTRACT_TIMEOUT_MS = 10_000;

const EMPTY: VideoMetadata = {
  durationSeconds: null,
  width: null,
  height: null,
  thumbnailBlob: null,
  thumbnailType: null,
};

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => window.clearTimeout(timer));
  });
}

function once(el: HTMLVideoElement, event: string, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => { cleanup(); resolve(false); }, ms);
    const ok = () => { cleanup(); resolve(true); };
    const fail = () => { cleanup(); resolve(false); };
    const cleanup = () => {
      window.clearTimeout(timer);
      el.removeEventListener(event, ok);
      el.removeEventListener("error", fail);
    };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", fail, { once: true });
  });
}

/** Recorte tipo "cover": un video vertical no se deforma, se recorta. */
function drawCover(ctx: CanvasRenderingContext2D, video: HTMLVideoElement) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.max(THUMB_WIDTH / vw, THUMB_HEIGHT / vh);
  const w = vw * scale;
  const h = vh * scale;
  ctx.drawImage(video, (THUMB_WIDTH - w) / 2, (THUMB_HEIGHT - h) / 2, w, h);
}

function toBlob(canvas: HTMLCanvasElement): Promise<{ blob: Blob; type: string } | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (webp) => {
        if (webp && webp.type === "image/webp") {
          resolve({ blob: webp, type: "image/webp" });
          return;
        }
        // Safari viejo no exporta WebP: caemos a JPEG con la misma calidad.
        canvas.toBlob(
          (jpeg) => resolve(jpeg ? { blob: jpeg, type: "image/jpeg" } : null),
          "image/jpeg",
          0.75,
        );
      },
      "image/webp",
      0.75,
    );
  });
}

async function readVideo(src: string, crossOrigin: boolean): Promise<VideoMetadata> {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  if (crossOrigin) video.crossOrigin = "anonymous";
  video.src = src;

  try {
    const gotMeta = await once(video, "loadedmetadata", EXTRACT_TIMEOUT_MS);
    if (!gotMeta || !video.videoWidth) return EMPTY;

    const duration = Number.isFinite(video.duration) && video.duration > 0
      ? Math.round(video.duration)
      : null;
    const width = video.videoWidth;
    const height = video.videoHeight;

    // Punto de captura: 15% de la pieza, con tope de 3 s. Ahí ya hay imagen.
    const target = Math.min((video.duration || 0) * 0.15, 3);
    video.currentTime = Number.isFinite(target) && target > 0 ? target : 0.1;

    const seeked = await once(video, "seeked", EXTRACT_TIMEOUT_MS);
    if (!seeked) return { durationSeconds: duration, width, height, thumbnailBlob: null, thumbnailType: null };

    const canvas = document.createElement("canvas");
    canvas.width = THUMB_WIDTH;
    canvas.height = THUMB_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { durationSeconds: duration, width, height, thumbnailBlob: null, thumbnailType: null };

    drawCover(ctx, video);

    // Sin CORS válido el canvas queda contaminado y toBlob lanza SecurityError.
    let out: { blob: Blob; type: string } | null = null;
    try {
      out = await toBlob(canvas);
    } catch {
      out = null;
    }

    return {
      durationSeconds: duration,
      width,
      height,
      thumbnailBlob: out?.blob ?? null,
      thumbnailType: out?.type ?? null,
    };
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}

/**
 * Duración, dimensiones y miniatura de un archivo de video, sin subirlo.
 * Nunca lanza: si el navegador no decodifica el formato (MOV con HEVC de
 * iPhone es el caso típico) devuelve todo en null y la subida sigue igual.
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  const url = URL.createObjectURL(file);
  try {
    return await withTimeout(readVideo(url, false), EXTRACT_TIMEOUT_MS, EMPTY);
  } catch {
    return EMPTY;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Igual, pero para un video que ya vive en Storage (backfill).
 * Necesita `crossOrigin="anonymous"` o el canvas queda contaminado.
 */
export async function extractVideoMetadataFromUrl(url: string): Promise<VideoMetadata> {
  try {
    return await withTimeout(readVideo(url, true), EXTRACT_TIMEOUT_MS, EMPTY);
  } catch {
    return EMPTY;
  }
}

/** Dimensiones reales de una imagen, medidas antes de subirla. */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  const url = URL.createObjectURL(file);
  try {
    return await withTimeout(
      new Promise<ImageMetadata>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: null, height: null });
        img.src = url;
      }),
      EXTRACT_TIMEOUT_MS,
      { width: null, height: null },
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Extensión que le corresponde al blob generado. */
export function thumbExtension(type: string | null): string {
  return type === "image/jpeg" ? "jpg" : "webp";
}
