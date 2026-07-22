import { useEffect, useRef } from "react";

/**
 * Floating particles canvas background (reactbits.dev style).
 * - ~150 dots drifting with organic wave motion + wrap-around.
 * - Breathing opacity between 0.2 and 0.6.
 * - Cursor within 120px: dots glow emerald, grow, and are gently repelled.
 * - Respects prefers-reduced-motion (paints once, no loop).
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  r: number;
  phase: number;
  seed: number;
}

const COUNT = 150;
const INTERACT_RADIUS = 120;
const BASE_COLOR = "120, 113, 108"; // stone-500
const ACCENT_COLOR = "16, 185, 129"; // emerald-500

const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      particlesRef.current = Array.from({ length: COUNT }, () => {
        const baseVx = (Math.random() - 0.5) * 0.5;
        const baseVy = (Math.random() - 0.5) * 0.5;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: baseVx,
          vy: baseVy,
          baseVx,
          baseVy,
          r: 1 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          seed: Math.random() * 1000,
        };
      });
    };

    resize();
    seed();

    const onResize = () => {
      resize();
      seed();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };
    const onMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      const mouse = mouseRef.current;

      for (const p of particlesRef.current) {
        // Organic wave in the drift direction.
        const wobbleX = Math.sin(t * 0.001 + p.seed) * 0.15;
        const wobbleY = Math.cos(t * 0.001 + p.seed * 1.3) * 0.15;

        // Mouse interaction: repel + highlight.
        let highlight = 0;
        let radius = p.r;
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < INTERACT_RADIUS && dist > 0.001) {
            const force = (1 - dist / INTERACT_RADIUS) * 0.6;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
            highlight = 1 - dist / INTERACT_RADIUS;
            radius = p.r * (1 + highlight * 0.8);
          }
        }

        // Ease velocity back toward base drift.
        p.vx += (p.baseVx - p.vx) * 0.03;
        p.vy += (p.baseVy - p.vy) * 0.03;

        p.x += p.vx + wobbleX;
        p.y += p.vy + wobbleY;

        // Wrap-around.
        if (p.x < -5) p.x = width + 5;
        else if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5;
        else if (p.y > height + 5) p.y = -5;

        // Breathing opacity 0.2 – 0.6.
        const breath = 0.2 + ((Math.sin(t * 0.0008 + p.phase) + 1) / 2) * 0.4;
        const color = highlight > 0 ? ACCENT_COLOR : BASE_COLOR;
        const alpha = highlight > 0 ? Math.min(1, breath + highlight * 0.5) : breath;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Static paint.
      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${BASE_COLOR}, 0.4)`;
        ctx.fill();
      }
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-screen w-screen"
      style={{ zIndex: 0 }}
    />
  );
};

export default ParticlesBackground;
