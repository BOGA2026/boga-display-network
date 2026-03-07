import { useEffect, useRef, useState, useCallback } from "react";

interface MouseParallaxResult {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export function useMouseParallax(intensity: number = 1): MouseParallaxResult {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ticking = useRef(false);
  const isMobile = useRef(false);

  useEffect(() => {
    isMobile.current = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile.current) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
  }, []);

  const onMove = useCallback(
    (e: MouseEvent) => {
      if (isMobile.current || ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const cx = (e.clientX / window.innerWidth - 0.5) * 2 * intensity;
        const cy = (e.clientY / window.innerHeight - 0.5) * 2 * intensity;
        setPos({ x: cx, y: cy });
        ticking.current = false;
      });
    },
    [intensity]
  );

  useEffect(() => {
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [onMove]);

  return pos;
}
