/**
 * DeferredMount — retrasa el montaje de un subárbol pesado (p. ej. gráficos con
 * recharts o mapas con leaflet) hasta DESPUÉS del primer render/pintado.
 *
 * Por qué: si el chunk pesado se importa durante el render, React suspende el
 * árbol y las tarjetas KPI y las tablas no se pintan hasta que baje el JS.
 * Aquí pintamos primero un placeholder ligero (skeleton) con altura reservada
 * —para evitar saltos de layout— y sólo entonces montamos el hijo `lazy`,
 * lo que dispara la descarga del chunk después del primer paint.
 *
 * Opcionalmente espera a que el bloque entre en viewport (`whenVisible`).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

interface DeferredMountProps {
  children: ReactNode;
  placeholder?: ReactNode;
  /** Altura mínima reservada mientras no está montado (px). */
  minHeight?: number;
  /** Si es true, espera además a que el contenedor sea visible. */
  whenVisible?: boolean;
  /** Margen del IntersectionObserver cuando `whenVisible`. */
  rootMargin?: string;
}

const idle = (cb: () => void): (() => void) => {
  const w = window as Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(() => cb(), { timeout: 500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 1);
  return () => window.clearTimeout(id);
};

export default function DeferredMount({
  children,
  placeholder = null,
  minHeight,
  whenVisible = false,
  rootMargin = "200px",
}: DeferredMountProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [painted, setPainted] = useState(false);
  const [visible, setVisible] = useState(!whenVisible);

  // Espera a un frame completo (primer paint) y luego a idle.
  useEffect(() => {
    let cancelIdle: (() => void) | undefined;
    const raf = requestAnimationFrame(() => {
      cancelIdle = idle(() => setPainted(true));
    });
    return () => {
      cancelAnimationFrame(raf);
      cancelIdle?.();
    };
  }, []);

  useEffect(() => {
    if (!whenVisible || visible || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [whenVisible, visible, rootMargin]);

  const ready = painted && visible;

  return (
    <div ref={ref} style={minHeight ? { minHeight } : undefined}>
      {ready ? children : placeholder}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Captura de pantalla diferida (html2canvas)
 *
 * html2canvas pesa ~200 kB: nunca debe entrar en el bundle inicial. Estas
 * utilidades hacen el import() dentro del handler y permiten precargarlo en
 * hover/focus, de modo que al hacer clic la librería ya está en caché.
 * ------------------------------------------------------------------------ */

type Html2Canvas = typeof import("html2canvas")["default"];

let capturePromise: Promise<Html2Canvas> | null = null;

/** Carga (una sola vez) html2canvas. Seguro de llamar tantas veces como quieras. */
export function loadCapture(): Promise<Html2Canvas> {
  if (!capturePromise) {
    capturePromise = import("html2canvas")
      .then((m) => m.default)
      .catch((err) => {
        capturePromise = null; // permite reintentar si falló la red
        throw err;
      });
  }
  return capturePromise;
}

export interface CaptureOptions {
  scale?: number;
  backgroundColor?: string | null;
  useCORS?: boolean;
  allowTaint?: boolean;
  /** Formato de salida del data URL. */
  type?: "image/png" | "image/jpeg";
  quality?: number;
}

/**
 * Captura un elemento del DOM y devuelve un data URL.
 * El import de html2canvas ocurre aquí dentro (dinámico).
 */
export async function captureElement(
  el: HTMLElement | null,
  { scale = 1, backgroundColor = null, useCORS = true, allowTaint = true, type = "image/png", quality = 0.92 }: CaptureOptions = {},
): Promise<string | null> {
  if (!el) return null;
  const html2canvas = await loadCapture();
  const canvas = await html2canvas(el, { scale, backgroundColor, useCORS, allowTaint });
  return canvas.toDataURL(type, quality);
}

/**
 * Props para precargar la librería al pasar el mouse / enfocar el botón.
 * Uso: <button {...preloadCapture()} onClick={...}>Descargar</button>
 */
export function preloadCapture() {
  const warm = () => {
    void loadCapture().catch(() => {});
  };
  return {
    onMouseEnter: warm,
    onFocus: warm,
    onTouchStart: warm,
  };
}
