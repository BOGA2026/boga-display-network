import { MonitorPlay, Sparkles, TrendingUp } from "lucide-react";
import { useParallax } from "@/hooks/useParallax";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import muestraPlatos from "@/assets/muestra-platos.gif";
import destacaPromociones from "@/assets/destaca-promociones.gif";

const steps = [
  {
    icon: MonitorPlay,
    title: "Muestra tus platos",
    description:
      "Fotos que abren el apetito. Tu comida se ve como se merece: grande, clara y con los precios bien visibles.",
    image: muestraPlatos,
    alt: "Menú digital animado en pantalla",
  },
  {
    icon: Sparkles,
    title: "Destaca lo que importa",
    description:
      "Combos, ofertas del día, platos nuevos. Con un clic eliges qué destacar y cuándo mostrarlo.",
    image: destacaPromociones,
    alt: "Restaurante con menú digital visible",
  },
  {
    icon: TrendingUp,
    title: "Vende más rápido",
    description:
      "Tus clientes deciden en segundos. La fila avanza. Tu cocina rinde más. Tú ganas más.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop",
    alt: "Servicio eficiente en restaurante",
  },
];

const ScrollDepthScene = () => {
  const headingParallax = useParallax({ speed: 0.1 });

  return (
    <section
      id="como-funciona"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.06) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div ref={headingParallax.ref} style={headingParallax.style}>
          <SectionReveal>
            <p className="text-sm font-medium uppercase tracking-widest text-primary mb-3">
              Así de fácil
            </p>
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl max-w-3xl">
              Tres pasos para vender más con tus pantallas
            </h2>
          </SectionReveal>
        </div>

        {/* Steps */}
        <div className="mt-16 md:mt-24 space-y-20 md:space-y-32">
          {steps.map((step, i) => (
            <StepRow key={step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

function StepRow({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  const imageParallax = useParallax({ speed: 0.2 + index * 0.05 });
  const reveal = useScrollReveal({ threshold: 0.2 });
  const isEven = index % 2 === 0;

  return (
    <div
      ref={reveal.ref}
      className={`grid items-center gap-8 md:gap-16 md:grid-cols-2 transition-all duration-700 ${
        reveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      <div
        ref={imageParallax.ref}
        className={`relative rounded-2xl overflow-hidden ${isEven ? "md:order-1" : "md:order-2"}`}
        style={imageParallax.style}
      >
        <img
          src={step.image}
          alt={step.alt}
          className="w-full aspect-[4/3] object-cover"
          loading="lazy"
        />
        {/* Neon border overlay */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: "inset 0 0 40px hsl(var(--primary) / 0.1)",
          }}
        />
        {/* Step number */}
        <div
          className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground"
          style={{ background: "hsl(var(--primary))" }}
        >
          {index + 1}
        </div>
      </div>

      {/* Text */}
      <div className={`${isEven ? "md:order-2" : "md:order-1"}`}>
        <div
          className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <step.icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          {step.title}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg max-w-md">
          {step.description}
        </p>
      </div>
    </div>
  );
}

function SectionReveal({ children }: { children: React.ReactNode }) {
  const reveal = useScrollReveal({ threshold: 0.2 });
  return (
    <div
      ref={reveal.ref}
      className={`transition-all duration-700 ${
        reveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

export default ScrollDepthScene;
