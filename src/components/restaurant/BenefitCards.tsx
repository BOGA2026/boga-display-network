import { TrendingUp, Clock, Zap, Palette } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useMouseParallax } from "@/hooks/useMouseParallax";

const cards = [
  {
    icon: TrendingUp,
    title: "Más ventas",
    description:
      "Tus clientes ven fotos apetitosas, promociones claras y deciden más rápido. Cada pantalla es un vendedor más.",
    accent: "var(--primary)",
  },
  {
    icon: Clock,
    title: "Menos tiempo explicando",
    description:
      "Tu equipo deja de repetir el menú y se enfoca en atender. Los pedidos fluyen solos.",
    accent: "var(--accent)",
  },
  {
    icon: Zap,
    title: "Cambios en segundos",
    description:
      "¿Subió un precio? ¿Nuevo combo? Lo actualizas desde tu celular. Listo. En todas las pantallas.",
    accent: "var(--primary)",
  },
  {
    icon: Palette,
    title: "Imagen profesional",
    description:
      "Tu restaurante se ve moderno y de confianza. Las pantallas elevan la experiencia del cliente.",
    accent: "var(--accent)",
  },
];

const BenefitCards = () => {
  const sectionReveal = useScrollReveal({ threshold: 0.1 });
  const mouse = useMouseParallax(0.15);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, hsl(var(--primary) / 0.06) 0%, transparent 100%)",
        }}
      />

      <div
        ref={sectionReveal.ref}
        className={`relative z-10 mx-auto max-w-6xl px-6 transition-all duration-700 ${
          sectionReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary mb-3">
            Lo que ganas
          </p>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            Beneficios reales, sin palabras técnicas
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {cards.map((card, i) => (
            <BenefitCard key={card.title} card={card} index={i} mouse={mouse} />
          ))}
        </div>
      </div>
    </section>
  );
};

function BenefitCard({
  card,
  index,
  mouse,
}: {
  card: (typeof cards)[0];
  index: number;
  mouse: { x: number; y: number };
}) {
  const reveal = useScrollReveal({ threshold: 0.25 });

  return (
    <div
      ref={reveal.ref}
      className={`group relative rounded-2xl p-8 transition-all duration-600 hover-lift ${
        reveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{
        transitionDelay: `${index * 120}ms`,
        background: "hsl(var(--card) / 0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid hsl(var(--border) / 0.5)",
        transform: reveal.isVisible
          ? `translate3d(${mouse.x * (index % 2 === 0 ? 3 : -3)}px, ${mouse.y * 2}px, 0)`
          : undefined,
        transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease, translate 0.6s ease",
      }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, hsl(${card.accent} / 0.1) 0%, transparent 70%)`,
        }}
      />

      <div
        className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl"
        style={{ background: `hsl(${card.accent} / 0.1)` }}
      >
        <card.icon className="h-7 w-7" style={{ color: `hsl(${card.accent})` }} />
      </div>

      <h3 className="relative font-display text-xl font-bold text-foreground mb-2">
        {card.title}
      </h3>
      <p className="relative text-sm text-muted-foreground leading-relaxed">
        {card.description}
      </p>
    </div>
  );
}

export default BenefitCards;
