import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import albertVideo from "@/assets/albert-visualia-dos.mov";
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
  const [videoMuted, setVideoMuted] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const toggleVideoMute = useCallback(() => {
    setVideoMuted((m) => {
      const next = !m;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  }, []);

  return (
    <section className="relative px-4 py-10 md:px-6 md:py-12">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(270 100% 45% / 0.08) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Video on the LEFT */}
        <div className="relative w-full lg:w-[320px] flex-shrink-0 order-2 lg:order-1">
          <div
            className="pointer-events-none absolute -inset-[3px] rounded-2xl animate-neon-breathe"
            style={{
              background: "transparent",
              boxShadow: "0 0 18px 3px hsl(270 100% 55% / 0.55), 0 0 50px 8px hsl(270 100% 50% / 0.25), inset 0 0 18px 2px hsl(270 100% 55% / 0.08)",
              border: "1.5px solid hsl(270 100% 60% / 0.7)",
              borderRadius: "1rem",
            }}
          />
          <div className="relative overflow-hidden rounded-2xl h-full" style={{ background: "hsl(260 30% 6%)" }}>
            <video
              ref={videoRef}
              src={albertVideo}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
            {/* Mute/Unmute button */}
            <button
              onClick={toggleVideoMute}
              className="absolute bottom-4 right-4 z-30 flex items-center justify-center rounded-full p-2.5 transition-all duration-300 hover-lift"
              style={{
                background: "hsl(260 30% 8% / 0.75)",
                border: "1.5px solid hsl(270 100% 60% / 0.5)",
                backdropFilter: "blur(8px)",
                boxShadow: videoMuted ? "none" : "0 0 14px 2px hsl(270 100% 60% / 0.6)",
              }}
              aria-label={videoMuted ? "Activar sonido" : "Silenciar"}
            >
              {videoMuted
                ? <VolumeX className="h-5 w-5" style={{ color: "hsl(270 60% 70%)" }} />
                : <Volume2 className="h-5 w-5" style={{ color: "hsl(270 100% 75%)", filter: "drop-shadow(0 0 6px hsl(270 100% 60%))" }} />
              }
            </button>
          </div>
        </div>

        {/* Carousel on the RIGHT */}
        <div className="relative flex-1 min-w-0 order-1 lg:order-2 flex flex-col">
          {/* Neon frame glow layers */}
          <div
            className="pointer-events-none absolute -inset-[3px] rounded-2xl animate-neon-breathe"
            style={{
              background: "transparent",
              boxShadow: "0 0 18px 3px hsl(270 100% 55% / 0.55), 0 0 50px 8px hsl(270 100% 50% / 0.25), inset 0 0 18px 2px hsl(270 100% 55% / 0.08)",
              border: "1.5px solid hsl(270 100% 60% / 0.7)",
              borderRadius: "1rem",
            }}
          />
          <div className="relative overflow-hidden rounded-2xl flex flex-col h-full"
            style={{ background: "hsl(260 30% 6%)" }}
          >
            {/* Image area — no text overlay */}
            <div className="relative aspect-[16/7] w-full overflow-hidden flex-shrink-0">
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
            </div>

            {/* Content & controls area below the image */}
            <div
              className="relative flex-1 flex items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6"
              style={{ background: "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 30% 6%) 100%)" }}
            >
              {/* Left: text content with animated transitions */}
              <div className="flex-1 min-w-0 relative overflow-hidden">
                {slides.map((slide, i) => (
                  <div
                    key={i}
                    className="transition-all duration-500"
                    style={{
                      opacity: i === current ? 1 : 0,
                      transform: i === current ? "translateY(0)" : "translateY(8px)",
                      position: i === current ? "relative" : "absolute",
                      inset: i === current ? undefined : 0,
                      pointerEvents: i === current ? "auto" : "none",
                    }}
                  >
                    <span
                      className="inline-block mb-1.5 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        background: "hsl(270 100% 50% / 0.15)",
                        border: "1px solid hsl(270 100% 60% / 0.4)",
                        color: "hsl(270 100% 80%)",
                        textShadow: "0 0 10px hsl(270 100% 60% / 0.5)",
                      }}
                    >
                      {slide.label}
                    </span>
                    <p className="text-sm font-medium text-foreground/80 md:text-base mt-1">
                      {slide.caption}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right: nav arrows + dots */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => { prev(); resetInterval(); }}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover-lift"
                    style={{
                      background: "hsl(270 100% 50% / 0.1)",
                      border: "1px solid hsl(270 100% 60% / 0.4)",
                    }}
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-4 w-4 text-primary" />
                  </button>
                  <button
                    onClick={() => { next(); resetInterval(); }}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover-lift"
                    style={{
                      background: "hsl(270 100% 50% / 0.1)",
                      border: "1px solid hsl(270 100% 60% / 0.4)",
                    }}
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { goTo(i); resetInterval(); }}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: i === current ? "1.5rem" : "0.375rem",
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
      </div>
    </section>
  );
};

export default ShowcaseCarousel;
