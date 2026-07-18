// Lightweight client-side error logger. Sentry-compatible surface so the app
// can later drop in @sentry/react by only changing this file.
//
// For now we log to console (grouped, deduped) and expose a `logError` helper
// that admin fetches / try-catch blocks call directly. Global listeners
// capture unhandled errors + rejected promises.

type Extra = Record<string, unknown>;

const recent = new Map<string, number>();
const DEDUPE_MS = 4_000;

function keyFor(err: unknown, extra?: Extra) {
  const base = err instanceof Error ? `${err.name}:${err.message}` : String(err);
  const ctx = extra ? JSON.stringify(extra) : "";
  return `${base}::${ctx}`;
}

export function logError(err: unknown, extra?: Extra) {
  const key = keyFor(err, extra);
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < DEDUPE_MS) return;
  recent.set(key, now);

  // eslint-disable-next-line no-console
  console.error("[admin]", extra?.label ?? "error", {
    error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
    ...extra,
  });

  // Placeholder — swap for Sentry.captureException in the future.
  const w = window as any;
  if (typeof w.Sentry?.captureException === "function") {
    try {
      w.Sentry.captureException(err, { extra });
    } catch {
      /* noop */
    }
  }
}

let installed = false;
export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => {
    logError(e.error ?? e.message, { label: "window.onerror", filename: e.filename });
  });
  window.addEventListener("unhandledrejection", (e) => {
    logError(e.reason, { label: "unhandledrejection" });
  });
}
