import { ArrowRight } from "lucide-react";
import { useParallax } from "@/hooks/useParallax";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface Props {
  onDemo: () => void;
}

const FinalCTA = ({ onDemo }: Props) => {
  const bgParallax = useParallax({ speed: 0.25 });
  const reveal = useScrollReveal({ threshold: 0.2 });

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div
        ref={bgParallax.ref}
        className="absolute inset-0 z-0"
        style={bgParallax.style}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, hsl(var(--primary) / 0.12) 0%, transparent 100%)",
          }}
        />
      </div>

      <div
        ref={reveal.ref}
        className={`relative z-10 mx-auto max-w-3xl px-6 text-center transition-all duration-700 ${
          reveal.isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-[0.97]"
        }`}
      >
        <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl leading-tight">
          Tus pantallas pueden ser{" "}
          <span className="text-gradient-primary">tus mejores vendedores</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
          Trabajan todo el día, sin descanso, sin sueldo. Solo necesitan una
          cosa: que les digas qué mostrar.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onDemo}
            className="group flex items-center gap-2 rounded-xl px-10 py-4 text-base font-semibold text-primary-foreground gradient-primary btn-glow cta-pulse transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            Empieza hoy
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground/60">
          Sin tarjeta de crédito · Configuración en 5 minutos · Soporte incluido
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
