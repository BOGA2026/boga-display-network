// Client-side error logger. Logs to console (grouped, deduped) and forwards to
// Sentry when a DSN is configured, preserving the `scope` / `section` tags used
// by the error boundaries. Known noise (stale chunks, offline network failures,
// browser extensions) is filtered out in src/lib/sentry.ts.

import { Sentry, isIgnoredError, isSentryEnabled } from "./sentry";

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

  reportError(err, extra);
}

/**
 * Forward an error to Sentry with `scope` / `section` tags. Safe to call even
 * when Sentry is disabled or the error is filtered noise.
 */
export function reportError(err: unknown, extra?: Extra) {
  if (!isSentryEnabled()) return;
  if (isIgnoredError(err)) return;

  const scope = (extra?.scope ?? extra?.label ?? "app") as string;
  const section = (extra?.section ?? extra?.route ?? "unknown") as string;

  Sentry.captureException(err, {
    tags: { scope, section },
    extra,
  });
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
