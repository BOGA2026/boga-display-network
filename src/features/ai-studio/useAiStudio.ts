import { useCallback, useEffect, useRef, useState } from "react";
import { aiStudio, type GenerationRow, type UsageState } from "./api";

/**
 * Centralizes progress, cancellation and history/usage refresh.
 *  - `progress` climbs on a fixed schedule (0 → 90%) while the request is
 *    in flight so the UI never freezes even if the model takes long.
 *  - Cancel aborts the fetch AND updates the row on the server so history
 *    reflects the real state.
 */
export function useAiStudio() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [history, setHistory] = useState<GenerationRow[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const pendingIdRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [u, h] = await Promise.all([aiStudio.usage(), aiStudio.history(30)]);
      setUsage(u);
      setHistory(h.items);
    } catch (e) {
      // Swallow — the panel already surfaces this on active errors.
      console.warn("ai-studio refresh failed", e);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startProgress = useCallback(() => {
    setProgress(5);
    let p = 5;
    timerRef.current = window.setInterval(() => {
      p = Math.min(90, p + Math.max(1, Math.round((92 - p) * 0.08)));
      setProgress(p);
    }, 400);
  }, []);
  const stopProgress = useCallback((final: number) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setProgress(final);
    if (final >= 100) window.setTimeout(() => setProgress(0), 600);
  }, []);

  const run = useCallback(
    async <T,>(fn: (signal: AbortSignal) => Promise<T>) => {
      setError(null);
      setBusy(true);
      startProgress();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const result = await fn(controller.signal);
        stopProgress(100);
        void refresh();
        return result;
      } catch (e) {
        if (controller.signal.aborted) {
          setError("Generación cancelada.");
        } else {
          const msg = e instanceof Error ? e.message : "Falló la generación.";
          setError(msg);
        }
        stopProgress(0);
        throw e;
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [refresh, startProgress, stopProgress],
  );

  const cancel = useCallback(async () => {
    abortRef.current?.abort();
    if (pendingIdRef.current) {
      try {
        await aiStudio.cancel(pendingIdRef.current);
      } catch { /* row may already be finalized */ }
    }
  }, []);

  const generateImage = useCallback(
    (input: { prompt: string; formato: "16:9" | "9:16" | "1:1" | "4:5"; watermark_off?: boolean; apply_brand_kit?: boolean }) =>
      run((s) => aiStudio.generateImage(input, s)),
    [run],
  );

  const generateVideoLoop = useCallback(
    (input: { prompt: string; duracion_segundos: number; formato: "16:9" | "9:16" | "1:1" }) =>
      run((s) => aiStudio.generateVideoLoop(input, s)),
    [run],
  );

  const suggestCopy = useCallback(
    (input: { tipo_promocion: string; contexto_negocio?: string }) => run((s) => aiStudio.suggestCopy(input, s)),
    [run],
  );

  const applyBrandKit = useCallback((generation_id: string) => run((s) => aiStudio.applyBrandKit(generation_id, s)), [run]);

  return {
    busy,
    progress,
    error,
    usage,
    history,
    refresh,
    cancel,
    generateImage,
    generateVideoLoop,
    suggestCopy,
    applyBrandKit,
  };
}
