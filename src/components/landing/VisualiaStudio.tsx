import { useState } from "react";
import { Camera, LayoutList, Clock, Crown, ArrowRight, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualiaStudioForm from "./VisualiaStudioForm";

const neon = "hsl(270 100% 65%)";

const cards = [
  {
    icon: Camera,
    title: "Productos que venden",
    desc: "Imágenes que aumentan el deseo de compra",
  },
  {
    icon: LayoutList,
    title: "Clientes deciden rápido",
    desc: "Menús claros eliminan la indecisión",
  },
  {
    icon: Clock,
    title: "Todo automático",
    desc: "Visualia actualiza tu contenido solo",
  },
];

const without = ["Menús desordenados", "Clientes dudan", "Menos ventas"];
const withStudio = ["Menús claros", "Clientes compran más rápido", "Más ventas"];

const VisualiaStudio = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="studio" className="relative px-6 py-24 md:py-32">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 30%, hsl(270 100% 50% / 0.08) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Badge */}
        <div className="mb-10 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full neon-border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neon">
            <Crown className="h-3.5 w-3.5 icon-neon" />
            Visualia Studio — Servicio Premium
          </span>
        </div>

        {/* Headline */}
        <div className="mb-20 text-center">
          <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight">
            Convierte tus pantallas en{" "}
            <span className="text-gradient-primary">una máquina de ventas</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Visualia muestra el contenido correcto, en el momento correcto, para aumentar tus ingresos automáticamente.
          </p>
        </div>

        {/* 3 Core Benefit Cards */}
        <div className="mb-20 grid gap-6 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group relative overflow-hidden glass-card hover:glass-card-hover rounded-2xl p-8 transition-all duration-300 hover-lift flex flex-col items-center text-center gap-5"
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 0 1px hsl(270 100% 65% / 0.5), 0 0 40px hsl(270 100% 50% / 0.1)` }}
                />
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-20"
                  style={{ background: "hsl(270 100% 60%)" }}
                />

                {/* Icon */}
                <div
                  className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: "hsl(270 100% 50% / 0.15)", border: "1px solid hsl(270 100% 65% / 0.35)", boxShadow: `0 0 20px hsl(270 100% 50% / 0.2)` }}
                >
                  <Icon className="h-8 w-8" style={{ color: neon }} strokeWidth={1.75} />
                </div>

                {/* Text */}
                <div className="relative">
                  <h3 className="font-display text-xl font-bold text-foreground leading-snug">{card.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Before / After Comparison */}
        <div className="mb-16 grid gap-4 md:grid-cols-2">
          {/* Without */}
          <div className="rounded-2xl p-8" style={{ background: "hsl(220 20% 8%)", border: "1px solid hsl(220 15% 16%)" }}>
            <p className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Sin Visualia</p>
            <ul className="space-y-4">
              {without.map((item) => (
                <li key={item} className="flex items-center gap-3 text-base text-muted-foreground">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/5">
                    <X className="h-3 w-3 text-muted-foreground/40" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* With Studio */}
          <div
            className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: "linear-gradient(135deg, hsl(270 40% 12%) 0%, hsl(260 35% 9%) 100%)", border: "1px solid hsl(270 100% 65% / 0.45)", boxShadow: "0 0 60px hsl(270 100% 50% / 0.12)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl animate-neon-breathe"
              style={{ background: "radial-gradient(ellipse at 20% 20%, hsl(270 100% 50% / 0.15) 0%, transparent 60%)" }}
            />
            <div className="relative">
              <div className="mb-6 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: neon }}>Con Visualia</p>
                <Crown className="h-3.5 w-3.5" style={{ color: neon }} />
              </div>
              <ul className="space-y-4">
                {withStudio.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base text-foreground/90">
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: "hsl(270 100% 50% / 0.2)", border: "1px solid hsl(270 100% 65% / 0.4)" }}
                    >
                      <Check className="h-3 w-3" style={{ color: neon }} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Single big stat */}
        <div className="mb-16 text-center">
          <p
            className="font-display text-6xl font-black md:text-7xl"
            style={{ color: neon, textShadow: `0 0 40px hsl(270 100% 65% / 0.7)` }}
          >
            +30%
          </p>
          <p className="mt-3 text-lg text-muted-foreground">aumento promedio en ventas</p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-10 text-lg text-primary-foreground"
            onClick={() => setShowForm(true)}
          >
            Solicitar Visualia Studio
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="neon-border neon-border-hover px-10 text-lg hover-lift">
            Ver ejemplos
          </Button>
        </div>
      </div>

      <VisualiaStudioForm open={showForm} onOpenChange={setShowForm} />
    </section>
  );
};

export default VisualiaStudio;
