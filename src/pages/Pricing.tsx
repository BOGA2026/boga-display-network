import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandingHeader from "@/components/landing/LandingHeader";
import PremiumBackground from "@/components/layout/PremiumBackground";
import ExpertChat from "@/components/landing/ExpertChat";
import {
  ArrowRight,
  Check,
  TrendingUp,
  Zap,
  Building2,
  ShieldCheck,
  BarChart3,
  Clock,
  Target,
  Megaphone,
} from "lucide-react";

const plans = [
  {
    id: "impulso",
    name: "Impulso",
    tagline: "Ideal para empezar a vender con pantallas digitales.",
    price: "$50.000",
    priceNote: "por pantalla / mes",
    highlighted: false,
    badge: null,
    benefits: [
      "Aumenta ventas por impulso",
      "Productos destacados estratégicamente",
      "Pantallas trabajando sin intervención",
    ],
    features: [
      "Hasta 5 pantallas",
      "10 GB de almacenamiento",
      "Programación básica de contenido",
      "Soporte por correo",
    ],
  },
  {
    id: "crecimiento",
    name: "Crecimiento",
    tagline: "Optimiza tu menú y aumenta ventas automáticamente.",
    price: "$42.000",
    priceNote: "por pantalla / mes",
    highlighted: true,
    badge: "MÁS ELEGIDO POR RESTAURANTES",
    benefits: [
      "Aumenta ventas por impulso",
      "Promociones automáticas",
      "Productos destacados estratégicamente",
      "Pantallas trabajando sin intervención",
    ],
    features: [
      "Hasta 20 pantallas",
      "50 GB de almacenamiento",
      "Programación avanzada por franjas",
      "Estadísticas de reproducción",
      "Soporte prioritario",
    ],
  },
  {
    id: "dominio",
    name: "Dominio",
    tagline: "Estandariza y controla todas tus sedes desde un solo lugar.",
    price: "$35.000",
    priceNote: "por pantalla / mes",
    highlighted: false,
    badge: null,
    benefits: [
      "Aumenta ventas por impulso",
      "Promociones automáticas",
      "Productos destacados estratégicamente",
      "Pantallas trabajando sin intervención",
      "Control multi-sede centralizado",
    ],
    features: [
      "Hasta 100 pantallas",
      "150 GB de almacenamiento",
      "Gestión multi-ubicación",
      "Reportes avanzados",
      "Soporte dedicado",
      "API de integración",
    ],
  },
];

const trustPoints = [
  { icon: TrendingUp, text: "+30% en ticket promedio reportado por nuestros clientes" },
  { icon: Clock, text: "Actualiza tu menú en menos de 30 segundos" },
  { icon: ShieldCheck, text: "Sin contratos de permanencia" },
  { icon: BarChart3, text: "Mide qué productos venden más" },
];

const Pricing = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <PremiumBackground>
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 md:pt-40">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 700, height: 500 }}>
          <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full animate-neon-breathe blur-[110px]" style={{ background: "hsl(270 100% 50%)", opacity: 0.2 }} />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Convierte tus pantallas en{" "}
            <span className="text-gradient-primary">vendedores automáticos.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground md:text-xl">
            Aumenta tu ticket promedio mostrando el contenido correcto en el momento correcto.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover-lift ${
                plan.highlighted
                  ? "neon-border glow-primary-sm bg-card/80 backdrop-blur-sm"
                  : "glass-card hover:glass-card-hover"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-primary-vibrant border-0 px-4 py-1 text-xs font-bold text-primary-foreground shadow-lg whitespace-nowrap">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <h3 className="font-display text-2xl font-bold text-foreground">
                Plan {plan.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-6">
                <span className="font-display text-4xl font-bold stat-glow">{plan.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">{plan.priceNote}</span>
              </div>

              {/* Results first */}
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                  Resultados
                </p>
                <ul className="space-y-2.5">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary icon-neon" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technical details in lower hierarchy */}
              <div className="mt-6 border-t border-border/20 pt-5">
                <p className="mb-3 text-xs text-muted-foreground/70 uppercase tracking-wider">
                  Incluye
                </p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-8">
                <Button
                  size="lg"
                  className={`w-full border-0 text-primary-foreground ${
                    plan.highlighted
                      ? "gradient-primary-vibrant cta-pulse btn-glow"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  onClick={() => setChatOpen(true)}
                >
                  Hablar con un experto
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Microcopy */}
        <p className="mx-auto mt-8 max-w-md text-center text-sm text-muted-foreground/60">
          Sin costos ocultos. Facturación en pesos colombianos.
        </p>
      </section>

      {/* Trust points */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((tp) => (
              <div
                key={tp.text}
                className="flex items-center gap-3 glass-card rounded-xl px-5 py-4 transition-all duration-300 hover-lift"
              >
                <tp.icon className="h-5 w-5 flex-shrink-0 text-primary icon-neon" />
                <span className="text-sm font-medium text-foreground">{tp.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confidence block */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Target className="mx-auto mb-5 h-8 w-8 text-primary icon-neon" />
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Tus pantallas deberían vender,{" "}
            <span className="text-gradient-primary">no solo mostrar.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Visualia diseña y gestiona el contenido de tus pantallas para influir en la decisión
            de compra del cliente dentro del local.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="relative overflow-hidden rounded-2xl neon-border px-8 py-16 md:px-16"
            style={{
              background:
                "linear-gradient(180deg, hsl(260 25% 14%) 0%, hsl(260 30% 8%) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 animate-neon-breathe"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(270 100% 50% / 0.2) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Empieza a vender más desde tu propia pantalla.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Únete a los restaurantes que ya usan Visualia para aumentar su ticket promedio.
              </p>
              <Button
                size="lg"
                className="mt-8 gradient-primary-vibrant cta-pulse btn-glow border-0 px-10 text-lg text-primary-foreground"
                onClick={() => setChatOpen(true)}
              >
                Hablar con un experto
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 px-6 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <span className="font-display text-sm font-bold text-gradient-primary">Visualia</span>
          <p className="mt-1 text-xs text-muted-foreground/50">
            © 2026 Visualia. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      <ExpertChat open={chatOpen} onOpenChange={setChatOpen} />
    </PremiumBackground>
  );
};

export default Pricing;
