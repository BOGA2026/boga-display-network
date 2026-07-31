// Sentry bootstrap + noise filtering.
//
// The DSN is a publishable value, so it lives in VITE_SENTRY_DSN. If it's not
// set (local dev, previews) Sentry stays disabled and errorLogger falls back to
// console logging only.

import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

let enabled = false;
export const isSentryEnabled = () => enabled;

/** Chunk / stale-deploy errors: the UI already recovers by reloading. */
const CHUNK_RE =
  /chunk|dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module|Loading CSS chunk|import\(\)/i;

/** Connectivity noise: user went offline, tab closed mid-request, etc. */
const NETWORK_RE =
  /Failed to fetch|NetworkError|Network request failed|Load failed|The Internet connection appears to be offline|ERR_INTERNET_DISCONNECTED|ERR_NETWORK|AbortError|The operation was aborted|TypeError: cancelled|net::ERR_/i;

/** Browser extensions / injected scripts — not our code. */
const EXTENSION_RE =
  /chrome-extension:|moz-extension:|safari-extension:|safari-web-extension:|extensions\/|^resource:\/\/|anonymous>|webkitMaskLoad|ResizeObserver loop|Non-Error promise rejection captured with keys/i;

function textOf(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack ?? ""}`;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/** True when the error is known noise and must never reach Sentry. */
export function isIgnoredError(err: unknown, framesText = ""): boolean {
  const text = `${textOf(err)}\n${framesText}`;
  if (CHUNK_RE.test(text)) return true;
  if (NETWORK_RE.test(text)) return true;
  if (EXTENSION_RE.test(text)) return true;
  // Offline device: every in-flight request will fail, none of it is a bug.
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return false;
}

export function initSentry() {
  if (enabled || !DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
    tracesSampleRate: 0,
    // Extension frames and cross-origin junk never get sent.
    denyUrls: [/extensions\//i, /^chrome(-| )extension:\/\//i, /^moz-extension:\/\//i, /^safari(-web)?-extension:\/\//i],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
    ],
    beforeSend(event, hint) {
      const frames = (event.exception?.values ?? [])
        .flatMap((v) => v.stacktrace?.frames ?? [])
        .map((f) => f.filename ?? "")
        .join("\n");
      const source = hint?.originalException ?? event.message ?? "";
      if (isIgnoredError(source, `${frames}\n${event.message ?? ""}`)) return null;
      return event;
    },
  });

  enabled = true;
}

export { Sentry };
