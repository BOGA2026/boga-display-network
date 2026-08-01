// Single source of truth for "how long without a heartbeat before we call it
// disconnected". Both `mark-offline-screens` (table: screens) and
// `sweep-devices` (table: devices) import this so the UI never shows the same
// physical device as offline in one view and live in another.
//
// Why 3 minutes: players send a heartbeat every 60s. A 90s cutoff means one
// lost beat = "disconnected", and restaurant WiFi drops beats constantly, so
// screens flicker between states. Three minutes = three consecutive missed
// beats, which is an actual problem worth surfacing.
export const OFFLINE_THRESHOLD_SECONDS = 180;

/** Same window, in milliseconds — handy for building an ISO cutoff. */
export const OFFLINE_THRESHOLD_MS = OFFLINE_THRESHOLD_SECONDS * 1000;

/** ISO timestamp before which a `last_seen_at` counts as stale. */
export function offlineCutoffISO(now: number = Date.now()): string {
  return new Date(now - OFFLINE_THRESHOLD_MS).toISOString();
}

/**
 * Grace window for screens that have NEVER reported in: a freshly created
 * screen shouldn't be flagged before the device has had a chance to pair.
 */
export const NEVER_SEEN_GRACE_SECONDS = 300;

export function neverSeenCutoffISO(now: number = Date.now()): string {
  return new Date(now - NEVER_SEEN_GRACE_SECONDS * 1000).toISOString();
}
