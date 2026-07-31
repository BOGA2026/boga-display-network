/**
 * Autoplay policy helpers.
 *
 * Browsers (iOS Safari, Chrome, mobile Firefox) block programmatic playback
 * unless the video is muted or the user already interacted with the page.
 * `attemptAutoplay` implements the standard escalation:
 *
 *   1. Try to play as-is.
 *   2. If it fails with NotAllowedError, force `muted` + `playsInline` and retry.
 *   3. If it still fails, queue a retry on the next real user interaction
 *      (pointerdown / touchstart / keydown / click / scroll).
 */

type Cleanup = () => void;

const INTERACTION_EVENTS = ["pointerdown", "touchstart", "keydown", "click", "scroll"] as const;

/** Set once the user has interacted with the document at least once. */
let userHasInteracted = false;

if (typeof window !== "undefined") {
  const mark = () => {
    userHasInteracted = true;
    INTERACTION_EVENTS.forEach((evt) => window.removeEventListener(evt, mark));
  };
  INTERACTION_EVENTS.forEach((evt) =>
    window.addEventListener(evt, mark, { passive: true, once: false })
  );
}

export function hasUserInteracted() {
  return userHasInteracted;
}

/** Registers a one-shot listener that fires on the first user gesture. */
function onNextInteraction(handler: () => void): Cleanup {
  if (typeof window === "undefined") return () => {};
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    handler();
  };
  const cleanup = () => {
    INTERACTION_EVENTS.forEach((evt) => window.removeEventListener(evt, run));
  };
  INTERACTION_EVENTS.forEach((evt) => window.addEventListener(evt, run, { passive: true }));
  return cleanup;
}

export interface AutoplayOptions {
  /** Allow falling back to muted playback when unmuted autoplay is blocked. Default: true. */
  allowMutedFallback?: boolean;
  /** Retry playback on the first user interaction if autoplay is rejected. Default: true. */
  retryOnInteraction?: boolean;
  /** Called when playback started; `muted` tells whether we had to mute it. */
  onPlaying?: (info: { muted: boolean }) => void;
  /** Called when playback is blocked and we're waiting for a user gesture. */
  onBlocked?: () => void;
}

/**
 * Try to autoplay a media element, degrading to muted playback and finally to
 * a retry on user interaction. Returns a cleanup function that removes any
 * pending interaction listener.
 */
export function attemptAutoplay(
  el: HTMLMediaElement | null | undefined,
  options: AutoplayOptions = {}
): Cleanup {
  const {
    allowMutedFallback = true,
    retryOnInteraction = true,
    onPlaying,
    onBlocked,
  } = options;

  if (!el) return () => {};

  let cancelled = false;
  let removeInteraction: Cleanup = () => {};

  // iOS requires playsInline for inline (non-fullscreen) playback.
  if (el instanceof HTMLVideoElement) {
    el.playsInline = true;
    el.setAttribute("playsinline", "");
  }

  const play = async (attempt: number): Promise<void> => {
    if (cancelled || !el.isConnected) return;
    try {
      await el.play();
      if (!cancelled) onPlaying?.({ muted: el.muted });
    } catch (err) {
      if (cancelled) return;
      const blocked =
        err instanceof DOMException
          ? err.name === "NotAllowedError" || err.name === "AbortError"
          : true;
      if (!blocked) return;

      if (attempt === 0 && allowMutedFallback && !el.muted) {
        el.muted = true;
        el.defaultMuted = true;
        el.setAttribute("muted", "");
        await play(1);
        return;
      }

      onBlocked?.();
      if (retryOnInteraction) {
        removeInteraction = onNextInteraction(() => {
          void play(attempt + 1);
        });
      }
    }
  };

  void play(0);

  return () => {
    cancelled = true;
    removeInteraction();
  };
}
