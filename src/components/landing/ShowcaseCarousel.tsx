import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import img1 from "@/assets/showcase-icecream-mall.jpeg";
import img2 from "@/assets/showcase-sandwich.jpeg";
import img3 from "@/assets/showcase-arroz.jpeg";
import img4 from "@/assets/showcase-mariscos.jpeg";
import img5 from "@/assets/showcase-helado-premium.jpeg";
import img6 from "@/assets/showcase-kiosk.jpeg";

const slides = [
  { src: img1, label: "Heladería", caption: "Menú digital en punto de venta premium" },
  { src: img2, label: "Sándwichería", caption: "Combos y promociones en pantalla horizontal" },
  { src: img3, label: "Food Court", caption: "Cartas digitales sincronizadas en múltiples pantallas" },
  { src: img4, label: "Mariscos", caption: "Menú digital con precios actualizados en tiempo real" },
  { src: img5, label: "Heladería Premium", caption: "Señalización vertical de alto impacto" },
  { src: img6, label: "Kiosko Digital", caption: "Pantalla autónoma en pasillo comercial" },
];

const ShowcaseCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((index + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4500);
  };

  return (
    <section className="relative px-6 py-16 md:py-20">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(270 100% 45% / 0.08) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Carousel */}
        <div className="relative group">
          {/* Main image */}
          <div className="relative overflow-hidden rounded-2xl neon-border"
            style={{ background: "hsl(260 30% 6%)" }}
          >
            {/* Glow overlay on hover */}
            <div
              className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "linear-gradient(180deg, transparent 50%, hsl(270 100% 10% / 0.85) 100%)" }}
            />

            {/* Image */}
            <div className="relative aspect-[16/7] w-full overflow-hidden">
              {slides.map((slide, i) => (
                <img
                  key={i}
                  src={slide.src}
                  alt={slide.label}
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
                  style={{
                    opacity: i === current ? 1 : 0,
                    transform: i === current ? "scale(1.03)" : "scale(1)",
                    transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              ))}

              {/* Caption overlay */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8"
                style={{ background: "linear-gradient(0deg, hsl(260 40% 5% / 0.9) 0%, transparent 100%)" }}
              >
                <div className="flex items-end justify-between">
                  <div>
                    <span className="inline-block mb-2 rounded-full neon-border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-neon">
                      {slides[current].label}
                    </span>
                    <p className="text-sm font-medium text-foreground/80 md:text-base">
                      {slides[current].caption}
                    </p>
                  </div>
                  {/* Dot indicators */}
                  <div className="flex gap-2">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { goTo(i); resetInterval(); }}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: i === current ? "2rem" : "0.375rem",
                          background: i === current ? "hsl(270 100% 60%)" : "hsl(270 100% 60% / 0.3)",
                          boxShadow: i === current ? "0 0 8px hsl(270 100% 60% / 0.8)" : "none",
                        }}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nav buttons */}
          <button
            onClick={() => { prev(); resetInterval(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full glass-card neon-border opacity-0 group-hover:opacity-100 transition-all duration-300 hover:glow-primary-sm hover-lift"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => { next(); resetInterval(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full glass-card neon-border opacity-0 group-hover:opacity-100 transition-all duration-300 hover:glow-primary-sm hover-lift"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default ShowcaseCarousel;
