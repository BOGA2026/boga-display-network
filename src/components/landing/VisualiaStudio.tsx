import { useState } from "react";
import {
  Tag,
  RefreshCw,
  ArrowRight,
  Crown,
} from "lucide-react";
import iconFotografia from "@/assets/icons/fotografia.png";
import iconMenu from "@/assets/icons/menu.png";
import iconAdaptaciones from "@/assets/icons/adaptaciones-multiformatos.png";
import iconEstrategia from "@/assets/icons/estrategia-franjas.png";
import { Button } from "@/components/ui/button";
import VisualiaStudioForm from "./VisualiaStudioForm";

const benefits = [
  {
    img: iconFotografia,
    icon: null,
    title: "Fotos que antojan",
    description: "Productos que se ven irresistibles.",
  },
  {
    img: iconMenu,
    icon: null,
    title: "Menú claro y ordenado",
    description: "El cliente entiende qué pedir en segundos.",
  },
  {
    img: null,
    icon: Tag,
    title: "Promociones que destacan",
    description: "Tus ofertas reciben atención real.",
  },
  {
    img: iconAdaptaciones,
    icon: null,
    title: "Funciona en cualquier pantalla",
    description: "Vertical, horizontal, TV o tablet.",
  },
  {
    img: iconEstrategia,
    icon: null,
    title: "Contenido por horario",
    description: "Desayuno, almuerzo y cena automáticos.",
  },
  {
    img: null,
    icon: RefreshCw,
    title: "Siempre actualizado",
    description: "Renovamos tu contenido cada mes.",
  },
];

const VisualiaStudio = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="studio" className="relative px-6 py-20 md:py-28">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 animate-neon-breathe"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, hsl(270 100% 50% / 0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full neon-border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neon">
            <Crown className="h-3.5 w-3.5 icon-neon" />
            Servicio Premium
          </span>
        </div>

        {/* Headline */}
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            El contenido que convierte{" "}
            <span className="text-gradient-primary">pantallas en ventas.</span>
          </h2>
           <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
             Nuestro equipo creativo desarrolla menús digitales, fotografía profesional y piezas visuales estratégicas diseñadas para aumentar ventas en tus pantallas.
           </p>
        </div>

        {/* Benefit cards */}
        <div className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className="group relative overflow-hidden glass-card hover:glass-card-hover rounded-xl p-7 transition-all duration-300 hover-lift"
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(ellipse at top right, hsl(270 100% 50% / 0.1) 0%, transparent 60%)",
                }}
              />
              <div className="relative flex flex-col items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl neon-border bg-primary/10 transition-all duration-300 group-hover:glow-primary-sm group-hover:bg-primary/15">
                  {b.img ? (
                    <img src={b.img} alt={b.title} className="h-6 w-6" />
                  ) : b.icon ? (
                    <b.icon className="h-6 w-6 text-primary icon-neon transition-all duration-300 group-hover:icon-neon-hover" strokeWidth={2.5} />
                  ) : null}
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {b.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison cards */}
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {/* Basic */}
          <div className="glass-card rounded-xl p-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Contenido básico
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Fotos de stock genéricas
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Diseño sin jerarquía visual
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Sin adaptación a horarios
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Menor conversión en pantalla
              </li>
            </ul>
          </div>

          {/* Studio */}
          <div className="relative overflow-hidden rounded-xl neon-border p-8 glow-primary-sm"
            style={{
              background:
                "linear-gradient(180deg, hsl(270 40% 12%) 0%, hsl(260 30% 8%) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 animate-neon-breathe"
              style={{
                background:
                  "radial-gradient(ellipse at top left, hsl(270 100% 50% / 0.12) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="mb-4 flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-neon">
                  Visualia Studio
                </p>
                <Crown className="h-3.5 w-3.5 text-primary icon-neon" />
              </div>
              <ul className="space-y-3 text-sm text-foreground/90">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary glow-primary-sm" />
                  Fotografía profesional de tus productos
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary glow-primary-sm" />
                  Menú diseñado para máxima legibilidad
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary glow-primary-sm" />
                  Contenido por franja horaria
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary glow-primary-sm" />
                  +30% conversión promedio en ventas
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Differentiator strip */}
        <div className="mb-12 rounded-xl neon-border px-6 py-5 text-center">
          <p className="text-sm font-medium text-foreground/80 md:text-base">
            No es solo software:{" "}
            <span className="text-gradient-primary font-semibold">
              es una solución completa
            </span>{" "}
            para que tu contenido se vea y se venda mejor.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-8 text-lg text-primary-foreground"
            onClick={() => setShowForm(true)}
          >
            Solicitar Visualia Studio
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="neon-border neon-border-hover px-8 text-lg hover-lift">
            Ver ejemplos
          </Button>
        </div>
      </div>

      {/* Form dialog */}
      <VisualiaStudioForm open={showForm} onOpenChange={setShowForm} />
    </section>
  );
};

export default VisualiaStudio;
