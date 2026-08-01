import { useEffect, useRef, useState } from "react";

export interface InlineVideoSource {
  src: string;
  type: "video/webm" | "video/mp4";
}

interface InlineVideoProps {
  /** WebM primero, MP4 de respaldo. Si viene vacío se muestra el marcador. */
  sources: InlineVideoSource[];
  poster?: string;
  /** Texto accesible del clip. */
  label: string;
  /** Relación de aspecto declarada para no mover el layout. */
  aspect?: string;
  className?: string;
  /** Empieza a cargar apenas se acerca al viewport. */
  rootMargin?: string;
  /** Texto del marcador cuando todavía no hay archivo cargado. */
  placeholder?: string;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * Video en línea para landing y panel. Reglas fijas:
 * sin audio, en bucle, sin sonido, sin pantalla completa forzada,
 * preload="none" hasta que el IntersectionObserver lo acerca al viewport,
 * y sin reproducción automática si la persona pidió menos movimiento.
 */
export default function InlineVideo({
  sources,
  poster,
  label,
  aspect = "16 / 9",
  className = "",
  rootMargin = "150px",
  placeholder = "Video en camino",
}: InlineVideoProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [reduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);

  useEffect(() => {
    if (!inView || reduced) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      v.load();
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => undefined);
    } catch {
      /* noop */
    }
  }, [inView, reduced]);

  const hasSources = sources.length > 0;

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden rounded-2xl border border-border/40 bg-muted/20 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {hasSources ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay={!reduced}
          controls={reduced}
          preload="none"
          poster={poster}
          aria-label={label}
          className="h-full w-full object-cover"
        >
          {inView
            ? sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)
            : null}
        </video>
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
          {placeholder}
        </div>
      )}
    </div>
  );
}
