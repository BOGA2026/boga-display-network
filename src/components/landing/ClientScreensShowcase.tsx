import { useEffect, useRef, useState } from "react";
import combo1 from "@/assets/combo1.mp4.asset.json";
import combo2 from "@/assets/combo2.mp4.asset.json";
import combo3 from "@/assets/combo3.mp4.asset.json";
import combo4 from "@/assets/combo4.mp4.asset.json";
import combo5 from "@/assets/combo5.mp4.asset.json";

type Slide = {
  client: string;
  src: string;
};

const SLIDES: Slide[] = [
  { client: "El Carnal · Comida mexicana", src: combo1.url },
  { client: "El Carnal · Comida mexicana", src: combo2.url },
  { client: "El Carnal · Comida mexicana", src: combo3.url },
  { client: "Mochisand", src: combo4.url },
  { client: "Mochisand", src: combo5.url },
];

const ROTATION_MS = 5000;

export default function ClientScreensShowcase() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActive((a) => (a + 1) % SLIDES.length);
    }, ROTATION_MS);
    return () => window.clearInterval(id);
  }, []);

  // Play only the active video, pause others
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="client-screens-title"
      className="relative px-4 py-20 md:px-6 md:py-28"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <h2
            id="client-screens-title"
            className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl"
          >
            Así se ven las pantallas de nuestros clientes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base md:text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
            Menús, promos y precios que se actualizan solos, a la hora exacta.
          </p>
        </header>

        {/* TV frame */}
        <div className="mx-auto w-full" style={{ maxWidth: 900 }}>
          <div
            className="relative rounded-[24px] border border-white/10 p-2 sm:p-3"
            style={{
              boxShadow:
                "0 30px 80px -20px rgba(0,0,0,0.35), 0 12px 40px -12px rgba(82,39,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            <div
              className="relative overflow-hidden rounded-[16px]"
              style={{ aspectRatio: "16 / 9" }}
            >
              {SLIDES.map((slide, i) => (
                <video
                  key={`${slide.client}-${i}`}
                  ref={(el) => (videoRefs.current[i] = el)}
                  src={slide.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden={i !== active}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    opacity: i === active ? 1 : 0,
                    transition: "opacity 500ms ease",
                  }}
                />
              ))}

              {/* EN VIVO badge */}
              <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 backdrop-blur-md sm:right-4 sm:top-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white sm:text-xs">
                  En vivo
                </span>
              </div>

              {/* Client chip */}
              <div className="absolute bottom-3 left-3 max-w-[70%] rounded-full border border-white/15 bg-black/45 px-3 py-1.5 backdrop-blur-md sm:bottom-4 sm:left-4">
                <span className="block truncate text-[11px] font-medium text-white/90 sm:text-sm">
                  {SLIDES[active].client}
                </span>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Selecciona cartelera">
            {SLIDES.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.client}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Ver ${s.client}`}
                  onClick={() => setActive(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 24 : 6,
                    background: isActive ? "#10b981" : "rgba(255,255,255,0.25)",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
