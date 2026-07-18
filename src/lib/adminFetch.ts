// Resilient wrapper around async data fetches used by the admin panel.
// - Hard timeout so UI never gets stuck on a hung request.
// - Automatic exponential backoff retries for transient errors (5xx, network).
// - Central hook to report failures to error logging.

import { logError } from "./errorLogger";

export type FetchOptions = {
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
  /** Label used in logs / error reporting */
  label?: string;
};

function isTransient(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message ?? err).toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return true;
  if (msg.includes("failed to fetch") || msg.includes("network")) return true;
  // Supabase / PostgREST style — status may be on error object.
  const status = err?.status ?? err?.code;
  if (typeof status === "number" && status >= 500 && status < 600) return true;
  if (typeof status === "string" && /^5\d\d$/.test(status)) return true;
  return false;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

/**
 * Runs `fn()` with a timeout and exponential backoff retries for transient errors.
 * The provided `fn` should throw on error (or return a rejected promise).
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  opts: FetchOptions = {}
): Promise<T> {
  const {
    timeoutMs = 12_000,
    retries = 2,
    baseDelayMs = 400,
    signal,
    label = "adminFetch",
  } = opts;

  let attempt = 0;
  let lastError: any;

  while (attempt <= retries) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error("Tiempo de espera agotado. Reintenta.")),
            timeoutMs
          )
        ),
      ]);
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isTransient(err)) {
        logError(err, { label, attempt });
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 150;
      await sleep(delay, signal);
      attempt += 1;
    }
  }
  throw lastError;
}
