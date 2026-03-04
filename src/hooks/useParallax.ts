import { useEffect, useRef, useState, useCallback } from "react";

interface ParallaxOptions {
  speed?: number; // 0 = no effect, 1 = full parallax (moves opposite to scroll)
  direction?: "up" | "down";
  scale?: boolean; // subtle scale on scroll
  opacity?: boolean; // fade based on visibility
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {}
) {
  const { speed = 0.15, direction = "up", scale = false, opacity = false } = options;
  const ref = useRef<T>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const ticking = useRef(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;

    // How far through the viewport (0 = just entering bottom, 1 = leaving top)
    const progress = 1 - (rect.top + rect.height) / (windowH + rect.height);
    const clamped = Math.max(0, Math.min(1, progress));

    // Center-relative offset: -0.5 to 0.5
    const offset = clamped - 0.5;

    const yShift = offset * speed * windowH * 0.3 * (direction === "up" ? -1 : 1);

    const newStyle: React.CSSProperties = {
      transform: `translate3d(0, ${yShift}px, 0)`,
      willChange: "transform",
    };

    if (scale) {
      const s = 1 + Math.abs(offset) * 0.03;
      newStyle.transform = `translate3d(0, ${yShift}px, 0) scale(${s})`;
    }

    if (opacity) {
      // Fade in from edges, full opacity in center
      newStyle.opacity = 1 - Math.abs(offset) * 0.6;
    }

    setStyle(newStyle);
    ticking.current = false;
  }, [speed, direction, scale, opacity]);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // initial

    return () => window.removeEventListener("scroll", onScroll);
  }, [update]);

  return { ref, style };
}
