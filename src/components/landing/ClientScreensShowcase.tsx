import { useEffect, useRef, useState } from "react";

type Slide = {
  client: string;
  gradient: string;
  render: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    client: "La Esquina · Restaurante",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 55%, #9a3412 100%)",
    render: (
      <div className="flex h-full w-full flex-col justify-center px-[6%] text-white">
        <p className="text-[clamp(10px,1.2vw,14px)] font-medium uppercase tracking-[0.3em] opacity-80">
          Hoy · Almuerzo
        </p>
        <h3 className="mt-2 font-display text-[clamp(28px,5.2vw,64px)] font-bold leading-none tracking-tight">
          MENÚ ALMUERZO
        </h3>
        <div className="mt-[clamp(12px,2.5vw,28px)] space-y-[clamp(6px,1.2vw,14px)] text-[clamp(13px,1.9vw,22px)]">
          {[
            ["Bandeja paisa", "$28.000"],
            ["Ajiaco santafereño", "$26.000"],
            ["Pechuga a la plancha", "$24.000"],
          ].map(([name, price]) => (
            <div key={name} className="flex items-baseline justify-between gap-6 border-b border-white/20 pb-[clamp(4px,0.8vw,8px)]">
              <span className="font-medium">{name}</span>
              <span className="font-semibold tabular-nums">{price}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    client: "Bar Andino",
    gradient: "linear-gradient(135deg, #4c1d95 0%, #a21caf 55%, #3b0764 100%)",
    render: (
      <div className="flex h-full w-full flex-col items-center justify-center px-[6%] text-center text-white">
        <p className="text-[clamp(10px,1.3vw,14px)] font-semibold uppercase tracking-[0.4em] opacity-80">
          Bar Andino
        </p>
        <h3 className="mt-3 font-display text-[clamp(48px,10vw,140px)] font-black leading-none tracking-tight">
          HAPPY HOUR
        </h3>
        <p className="mt-1 font-display text-[clamp(56px,11vw,160px)] font-black leading-none tracking-tight text-fuchsia-200">
          2×1
        </p>
        <p className="mt-[clamp(10px,2vw,22px)] text-[clamp(13px,1.9vw,22px)] opacity-90">
          Todos los días · 5 a 8 p.m.
        </p>
      </div>
    ),
  },
  {
    client: "Panadería Doña Rosa",
    gradient: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 45%, #78350f 100%)",
    render: (
      <div className="flex h-full w-full flex-col justify-center px-[6%] text-[#3b1f05]">
        <p className="text-[clamp(10px,1.2vw,14px)] font-semibold uppercase tracking-[0.35em] opacity-70">
          Panadería Doña Rosa
        </p>
        <h3 className="mt-3 font-display text-[clamp(30px,5.6vw,72px)] font-black leading-[0.95] tracking-tight">
          PAN RECIÉN
          <br />
          HORNEADO
        </h3>
        <p className="mt-[clamp(10px,2vw,20px)] text-[clamp(14px,2vw,24px)] font-medium">
          Croissant + café{" "}
          <span className="font-bold">$9.900</span>
        </p>
      </div>
    ),
  },
  {
    client: "GymFit",
    gradient: "linear-gradient(135deg, #34d399 0%, #0d9488 55%, #064e3b 100%)",
    render: (
      <div className="flex h-full w-full flex-col items-center justify-center px-[6%] text-center text-white">
        <p className="text-[clamp(10px,1.2vw,14px)] font-semibold uppercase tracking-[0.4em] opacity-80">
          GymFit
        </p>
        <h3 className="mt-3 font-display text-[clamp(30px,5.8vw,76px)] font-black leading-none tracking-tight">
          PLAN TRIMESTRE
        </h3>
        <p className="mt-2 font-display text-[clamp(72px,14vw,180px)] font-black leading-none tracking-tighter">
          −30%
        </p>
        <p className="mt-[clamp(8px,1.6vw,18px)] text-[clamp(13px,1.9vw,22px)] opacity-90">
          Solo esta semana
        </p>
      </div>
    ),
  },
];

const ROTATION_MS = 3500;

export default function ClientScreensShowcase() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
              background: "#0a0a0a",
              boxShadow:
                "0 30px 80px -20px rgba(0,0,0,0.7), 0 12px 40px -12px rgba(82,39,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            <div
              className="relative overflow-hidden rounded-[16px]"
              style={{ aspectRatio: "16 / 9", background: "#000" }}
            >
              {SLIDES.map((slide, i) => (
                <div
                  key={slide.client}
                  aria-hidden={i !== active}
                  className="absolute inset-0"
                  style={{
                    background: slide.gradient,
                    opacity: i === active ? 1 : 0,
                    transition: "opacity 500ms ease",
                  }}
                >
                  {slide.render}
                </div>
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
