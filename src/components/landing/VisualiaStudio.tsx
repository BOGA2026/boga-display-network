import { useState } from "react";
import {
  Camera,
  LayoutGrid,
  Sparkles,
  MonitorSmartphone,
  Clock,
  RefreshCw,
  ArrowRight,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualiaStudioForm from "./VisualiaStudioForm";

const benefits = [
  { icon: Camera, title: "Fotografía gastronómica profesional" },
  { icon: LayoutGrid, title: "Diseño de menú digital optimizado para lectura rápida" },
  { icon: Sparkles, title: "Piezas visuales para promociones y temporadas" },
  { icon: MonitorSmartphone, title: "Adaptaciones para pantallas verticales y horizontales" },
  { icon: Clock, title: "Estrategia visual por franjas horarias (desayuno/almuerzo/cena)" },
  { icon: RefreshCw, title: "Actualizaciones mensuales opcionales" },
];

const VisualiaStudio = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="studio" className="relative px-6 py-20 md:py-28">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, hsl(270 100% 50% / 0.3) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              borderColor: "hsl(270 100% 50% / 0.4)",
              background: "hsl(270 100% 50% / 0.08)",
              color: "hsl(280 100% 70%)",
            }}
          >
            <Crown className="h-3.5 w-3.5" />
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
        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group relative overflow-hidden rounded-xl border p-6 transition-all hover:border-primary/40"
              style={{
                borderColor: "hsl(260 15% 18%)",
                background:
                  "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 25% 8%) 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(ellipse at top right, hsl(270 100% 50% / 0.06) 0%, transparent 60%)",
                }}
              />
              <div className="relative flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="pt-1 text-sm font-medium leading-relaxed text-foreground/90">
                  {b.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison cards */}
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {/* Basic */}
          <div
            className="rounded-xl border p-8"
            style={{
              borderColor: "hsl(260 15% 18%)",
              background: "linear-gradient(180deg, hsl(260 25% 10%) 0%, hsl(260 20% 8%) 100%)",
            }}
          >
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
          <div
            className="relative overflow-hidden rounded-xl border p-8"
            style={{
              borderColor: "hsl(270 100% 50% / 0.3)",
              background:
                "linear-gradient(180deg, hsl(270 40% 12%) 0%, hsl(260 30% 8%) 100%)",
              boxShadow: "0 0 40px -12px hsl(270 100% 50% / 0.2)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                background:
                  "radial-gradient(ellipse at top left, hsl(270 100% 50%) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="mb-4 flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Visualia Studio
                </p>
                <Crown className="h-3.5 w-3.5 text-primary" />
              </div>
              <ul className="space-y-3 text-sm text-foreground/90">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Fotografía profesional de tus productos
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Menú diseñado para máxima legibilidad
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Contenido por franja horaria
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  +30% conversión promedio en ventas
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Differentiator strip */}
        <div
          className="mb-12 rounded-xl border px-6 py-5 text-center"
          style={{
            borderColor: "hsl(270 100% 50% / 0.15)",
            background: "hsl(270 100% 50% / 0.04)",
          }}
        >
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
            className="gradient-primary glow-primary border-0 px-8 text-lg text-primary-foreground"
            onClick={() => setShowForm(true)}
          >
            Solicitar Visualia Studio
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="border-border/40 px-8 text-lg">
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
