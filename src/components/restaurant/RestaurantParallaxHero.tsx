import { ArrowRight, Play } from "lucide-react";
import { useParallax } from "@/hooks/useParallax";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import heroRestaurantBg from "@/assets/hero-restaurant-bg.png";

interface Props {
  onDemo: () => void;
}

const RestaurantParallaxHero = ({ onDemo }: Props) => {
  const bgParallax = useParallax({ speed: 0.4, scale: true });
  const mouse = useMouseParallax(0.3);
  const reveal = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image layer — slowest */}
      <div
        ref={bgParallax.ref}
        className="absolute inset-0 z-0"
        style={bgParallax.style}
      >
        <img
          src={heroRestaurantBg}
          alt="Interior de restaurante moderno con pantallas digitales"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--background) / 0.5) 0%, hsl(var(--background) / 0.85) 60%, hsl(var(--background)) 100%)",
          }}
        />
      </div>

      {/* Floating ambient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full animate-neon-breathe pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          transform: `translate3d(${mouse.x * 20}px, ${mouse.y * 15}px, 0)`,
          transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full animate-neon-breathe pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
          transform: `translate3d(${mouse.x * -15}px, ${mouse.y * -10}px, 0)`,
          transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          animationDelay: "2s",
        }}
      />

      {/* Content */}
      <div
        ref={reveal.ref}
        className={`relative z-10 mx-auto max-w-4xl px-6 text-center transition-all duration-1000 ${
          reveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
        style={{
          transform: `translate3d(${mouse.x * -5}px, ${mouse.y * -3}px, 0)`,
          transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 1s ease, translate 1s ease",
        }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest glass-card border border-primary/20 text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Solución para Restaurantes
        </div>

        <h1 className="font-display text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Tus pantallas ahora
          <br />
          <span className="text-gradient-primary">trabajan para vender</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
          Deja de perder ventas con menús estáticos. Visualia convierte cada TV
          en un vendedor digital que muestra, destaca y convence — todo el día,
          sin descanso.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onDemo}
            className="group flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-primary-foreground gradient-primary btn-glow cta-pulse transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            Empieza hoy
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <a
            href="#como-funciona"
            className="group flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-foreground border border-border/60 hover:border-primary/40 transition-colors glass-card"
          >
            <Play className="h-4 w-4 text-primary" />
            Ver cómo funciona
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-float">
        <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">Scroll</span>
        <div className="h-8 w-[1px] bg-gradient-to-b from-primary/60 to-transparent" />
      </div>
    </section>
  );
};

export default RestaurantParallaxHero;
