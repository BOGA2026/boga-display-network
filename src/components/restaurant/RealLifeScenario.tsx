import { useParallax } from "@/hooks/useParallax";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const moments = [
  { emoji: "👨‍👩‍👧‍👦", text: "Una familia entra al restaurante." },
  { emoji: "📺", text: "Miran la pantalla y ven los combos al instante." },
  { emoji: "🍔", text: 'El niño señala: "¡Esa hamburguesa!"' },
  { emoji: "✅", text: "Los papás ya saben qué pedir." },
  { emoji: "⚡", text: "Ordenan rápido. La fila avanza." },
  { emoji: "🔥", text: "Tu cocina trabaja mejor." },
];

const RealLifeScenario = () => {
  const bgParallax = useParallax({ speed: 0.3 });
  const sectionReveal = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background image with parallax */}
      <div
        ref={bgParallax.ref}
        className="absolute inset-0 z-0"
        style={bgParallax.style}
      >
        <img
          src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1920&auto=format&fit=crop"
          alt="Ambiente de restaurante"
          className="w-full h-[130%] object-cover opacity-20"
          loading="lazy"
        />
      </div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 50%, hsl(var(--background)) 100%)",
        }}
      />

      <div
        ref={sectionReveal.ref}
        className={`relative z-10 mx-auto max-w-4xl px-6 transition-all duration-700 ${
          sectionReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <p className="text-sm font-medium uppercase tracking-widest text-primary mb-3">
          Escena real
        </p>
        <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl max-w-2xl">
          Esto pasa cuando tus pantallas venden por ti
        </h2>

        {/* Timeline */}
        <div className="mt-14 relative">
          {/* Vertical line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-px hidden md:block"
            style={{
              background:
                "linear-gradient(180deg, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.1) 100%)",
            }}
          />

          <div className="space-y-6">
            {moments.map((m, i) => (
              <MomentCard key={i} moment={m} index={i} />
            ))}
          </div>

          {/* Final punch */}
          <div className="mt-10 md:ml-16">
            <div
              className="rounded-2xl p-6 md:p-8 glass-card neon-border"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--card)) 100%)",
              }}
            >
              <p className="font-display text-xl font-bold text-foreground md:text-2xl">
                Tú vendes más. Sin complicarte. Sin esfuerzo extra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function MomentCard({
  moment,
  index,
}: {
  moment: { emoji: string; text: string };
  index: number;
}) {
  const reveal = useScrollReveal({ threshold: 0.3 });

  return (
    <div
      ref={reveal.ref}
      className={`flex items-start gap-4 md:gap-6 transition-all duration-500 ${
        reveal.isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: "hsl(var(--card))" }}
      >
        {moment.emoji}
      </div>
      <p className="text-base text-muted-foreground md:text-lg pt-2.5">{moment.text}</p>
    </div>
  );
}

export default RealLifeScenario;
