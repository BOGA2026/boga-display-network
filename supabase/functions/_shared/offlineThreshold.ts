// ÚNICA fuente de verdad del umbral de desconexión, compartida por las edge
// functions (Deno) y por el cliente web (alias `@shared`, ver vite.config.ts).
// No copiar el número en ningún otro archivo: importarlo desde acá.
//
// Por qué 3 minutos: los reproductores envían un latido cada 60 s. Con 90 s,
// un solo latido perdido ya marca "desconectado", y el WiFi de un restaurante
// pierde latidos todo el tiempo. Tres minutos = tres latidos perdidos, que sí
// indican un problema real.
export const OFFLINE_THRESHOLD_SECONDS = 180;

/** Misma ventana, en milisegundos. */
export const OFFLINE_THRESHOLD_MS = OFFLINE_THRESHOLD_SECONDS * 1000;

/** ISO a partir del cual un `last_seen_at` se considera vencido. */
export function offlineCutoffISO(now: number = Date.now()): string {
  return new Date(now - OFFLINE_THRESHOLD_MS).toISOString();
}

/**
 * Gracia para equipos que NUNCA reportaron: una pantalla recién creada no
 * debería marcarse antes de que el dispositivo alcance a vincularse.
 * También se usa en el cliente como ventana de "sincronizando".
 */
export const NEVER_SEEN_GRACE_SECONDS = 300;

export const NEVER_SEEN_GRACE_MS = NEVER_SEEN_GRACE_SECONDS * 1000;

export function neverSeenCutoffISO(now: number = Date.now()): string {
  return new Date(now - NEVER_SEEN_GRACE_SECONDS * 1000).toISOString();
}

/** Deriva el estado en vivo desde `last_seen_at` sin consultar la base. */
export function deriveLiveStatus(
  lastSeenAt: string | null | undefined,
): "online" | "syncing" | "offline" {
  if (!lastSeenAt) return "offline";
  const age = Date.now() - new Date(lastSeenAt).getTime();
  if (age < OFFLINE_THRESHOLD_MS) return "online";
  if (age < NEVER_SEEN_GRACE_MS) return "syncing";
  return "offline";
}
