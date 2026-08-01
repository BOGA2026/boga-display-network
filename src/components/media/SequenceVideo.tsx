import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { InlineVideoSource } from "@/components/media/InlineVideo";

export interface SequenceClip {
  label: string;
  sources: InlineVideoSource[];
  poster?: string;
}

interface Props {
  clips: SequenceClip[];
  aspect?: string;
  className?: string;
  /** Texto del marcador cuando ningún clip tiene archivo. */
  placeholder?: string;
}

const CROSSFADE_MS = 300;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * Reproductor en secuencia continua: un solo escenario visible, dos capas de
 * <video> que se cruzan 300 ms al cambiar de clip. Nada se pide a la red hasta
 * que la sección entra en pantalla; el siguiente clip se precarga recién
 * mientras corre el actual (nunca los cuatro de entrada). Si un clip falla,
 * salta al siguiente sin romper el bucle.
 */
export default function SequenceVideo({
  clips,
  aspect = "16 / 9",
  className = "",
  placeholder = "Video en camino",
}: Props) {
  const playable = clips.filter((c) => c.sources.length > 0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const layerA = useRef<HTMLVideoElement | null>(null);
  const layerB = useRef<HTMLVideoElement | null>(null);
  const fadingRef = useRef(false);

  const [inView, setInView] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const [front, setFront] = useState<"a" | "b">("a");
  const [progress, setProgress] = useState(0);
  const [reduced] = useState(prefersReducedMotion);
  const [failed, setFailed] = useState(false);

  const activeEl = () => (front === "a" ? layerA.current : layerB.current);
  const backEl = () => (front === "a" ? layerB.current : layerA.current);

  // Entrada / salida del viewport: arranca y pausa la secuencia.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: "100px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const loadInto = useCallback(
    (el: HTMLVideoElement | null, clip: SequenceClip | undefined) => {
      if (!el || !clip) return;
      const first = clip.sources[0]?.src;
      const current = el.getAttribute("data-src");
      if (current === first) return;
      el.setAttribute("data-src", first ?? "");
      el.innerHTML = "";
      for (const s of clip.sources) {
        const source = document.createElement("source");
        source.src = s.src;
        source.type = s.type;
        el.appendChild(source);
      }
      try {
        el.load();
      } catch {
        /* noop */
      }
    },
    [],
  );

  // Carga el clip activo y lo reproduce.
  useEffect(() => {
    if (!playable.length) return;
    if (!inView || (reduced && !started)) return;
    const el = activeEl();
    loadInto(el, playable[index]);
    if (!el || paused) return;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => undefined);
    setStarted(true);
  }, [inView, index, front, paused, reduced, started, loadInto, playable.length]);

  // Pausa al salir de pantalla.
  useEffect(() => {
    if (inView) return;
    layerA.current?.pause();
    layerB.current?.pause();
  }, [inView]);

  const goTo = useCallback(
    (next: number, crossfade: boolean) => {
      if (!playable.length) return;
      const target = ((next % playable.length) + playable.length) % playable.length;
      const back = backEl();
      loadInto(back, playable[target]);
      setProgress(0);
      setIndex(target);
      if (crossfade && back) {
        fadingRef.current = true;
        const p = back.play();
        if (p && typeof p.catch === "function") p.catch(() => undefined);
        setFront((f) => (f === "a" ? "b" : "a"));
        window.setTimeout(() => {
          fadingRef.current = false;
        }, CROSSFADE_MS);
      } else {
        setFront((f) => (f === "a" ? "b" : "a"));
      }
    },
    [loadInto, playable],
  );

  const handleEnded = () => goTo(index + 1, true);

  const handleError = () => {
    if (playable.length <= 1) {
      setFailed(true);
      return;
    }
    goTo(index + 1, false);
  };

  const handleTime = (el: HTMLVideoElement | null) => {
    if (!el || !el.duration || Number.isNaN(el.duration)) return;
    setProgress(Math.min(1, el.currentTime / el.duration));
    // Precarga del siguiente mientras corre el actual.
    if (el.currentTime > 0.4 && playable.length > 1) {
      loadInto(backEl(), playable[(index + 1) % playable.length]);
    }
  };

  const togglePause = () => {
    const el = activeEl();
    if (!el) return;
    if (paused) {
      setPaused(false);
      setStarted(true);
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => undefined);
    } else {
      setPaused(true);
      el.pause();
    }
  };

  const poster = playable[0]?.poster ?? clips[0]?.poster;
  const hasClips = playable.length > 0;
  const showPlayOverlay = hasClips && ((reduced && !started) || paused);

  return (
    <div className={className}>
      <div
        ref={wrapRef}
        className="group relative overflow-hidden rounded-2xl border border-border/40 bg-muted/20"
        style={{ aspectRatio: aspect }}
      >
        {hasClips && !failed ? (
          <>
            {(["a", "b"] as const).map((layer) => (
              <video
                key={layer}
                ref={layer === "a" ? layerA : layerB}
                muted
                playsInline
                preload="none"
                poster={layer === "a" ? poster : undefined}
                controls={false}
                disablePictureInPicture
                aria-hidden={front !== layer}
                aria-label={playable[index]?.label}
                onEnded={front === layer ? handleEnded : undefined}
                onError={front === layer ? handleError : undefined}
                onTimeUpdate={
                  front === layer
                    ? (e) => handleTime(e.currentTarget)
                    : undefined
                }
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                style={{ opacity: front === layer ? 1 : 0 }}
              />
            ))}

            {showPlayOverlay && (
              <button
                type="button"
                onClick={togglePause}
                aria-label={paused ? "Reanudar el video" : "Reproducir el video"}
                className="absolute inset-0 flex items-center justify-center bg-background/40"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Play className="h-6 w-6" aria-hidden="true" />
                </span>
              </button>
            )}

            {!showPlayOverlay && (
              <button
                type="button"
                onClick={togglePause}
                aria-label="Pausar el video"
                className="absolute right-3 top-3 hidden h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:flex"
              >
                <Pause className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </>
        ) : poster ? (
          <img src={poster} alt={clips[0]?.label ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            {placeholder}
          </div>
        )}
      </div>

      {/* Indicador de pasos */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {clips.map((c, i) => {
          const playIdx = playable.indexOf(c);
          const isActive = playIdx === index && playIdx !== -1;
          const isDone = playIdx !== -1 && playIdx < index;
          const fill = isActive ? progress : isDone ? 1 : 0;
          return (
            <button
              key={c.label}
              type="button"
              disabled={playIdx === -1}
              onClick={() => playIdx !== -1 && goTo(playIdx, true)}
              aria-current={isActive ? "true" : undefined}
              className="flex min-h-11 flex-col justify-end gap-2 rounded-lg px-1 pb-1 text-left disabled:cursor-default disabled:opacity-50"
            >
              <span
                className={`text-sm ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}
              >
                {c.label}
              </span>
              <span className="block h-0.5 w-full overflow-hidden rounded-full bg-border/60">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-200 ease-linear"
                  style={{ width: `${fill * 100}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
