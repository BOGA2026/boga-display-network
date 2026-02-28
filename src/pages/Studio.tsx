import { useState } from "react";
import PremiumBackground from "@/components/layout/PremiumBackground";
import LandingHeader from "@/components/landing/LandingHeader";
import ExpertChat from "@/components/landing/ExpertChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Check,
  Target,
  ShieldCheck,
  Crown,
  Receipt,
  ScaleIcon,
} from "lucide-react";

const plans = [
  {
    id: "impulso",
    name: "Impulso",
    tagline: "Ideal para restaurantes y cafés que quieren empezar a vender con pantallas digitales.",
    setup: "$990.000",
    monthly: "$290.000",
    monthlyLabel: "COP por pantalla",
    highlighted: false,
    badge: null,
    includesFrom: null,
    features: [
      "Diseño profesional de carta digital",
      "Configuración inicial del sistema",
      "Adaptación visual de productos",
      "Programación básica de contenidos",
      "1 actualización mensual",
      "Soporte técnico remoto",
      "Plataforma Visualia activa 24/7",
    ],
  },
  {
    id: "crecimiento",
    name: "Crecimiento",
    tagline: "Optimiza tu menú y aumenta ventas automáticamente.",
    setup: "$2.900.000",
    monthly: "$690.000",
    monthlyLabel: "COP",
    highlighted: true,
    badge: "MÁS ELEGIDO POR RESTAURANTES",
    includesFrom: "Incluye todo lo del Plan Impulso más:",
    features: [
      "Rediseño estratégico del menú",
      "Fotografías optimizadas para venta",
      "Animaciones promocionales",
      "Estrategia de productos destacados",
      "Programación automática por horarios",
      "Promociones inteligentes",
      "2 actualizaciones mensuales",
      "Optimización continua de contenido",
    ],
  },
  {
    id: "dominio",
    name: "Dominio",
    tagline: "Para marcas con múltiples sedes que buscan control total y crecimiento constante.",
    setup: "Desde $5.900.000",
    monthly: "Desde $1.490.000",
    monthlyLabel: "COP",
    highlighted: false,
    badge: null,
    includesFrom: "Incluye todo lo del Plan Crecimiento más:",
    features: [
      "Gestión multi-sede sincronizada",
      "Producción audiovisual promocional",
      "Campañas estacionales",
      "Videos comerciales para pantallas",
      "Actualizaciones ilimitadas",
      "Estrategia visual continua",
      "Prioridad en soporte",
      "Escalabilidad nacional",
    ],
  },
];

const Studio = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <PremiumBackground>
      <LandingHeader />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-36 md:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 900, height: 700 }}>
          <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full opacity-20 blur-[120px]" style={{ background: "hsl(270 100% 50%)" }} />
          <div className="absolute left-1/3 top-48 h-56 w-56 rounded-full opacity-15 blur-[90px]" style={{ background: "hsl(290 100% 50%)" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <span
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-widest"
            style={{
              borderColor: "hsl(270 100% 50% / 0.4)",
              background: "hsl(270 100% 50% / 0.08)",
              color: "hsl(280 100% 70%)",
            }}
          >
            <Crown className="h-4 w-4" />
            Visualia Studio
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Convierte tus pantallas en{" "}
            <span className="text-gradient-primary">vendedores automáticos.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Visualia muestra el contenido correcto en el momento correcto para aumentar tu ticket promedio dentro del local.
          </p>
        </div>
      </section>

      {/* ─── Plans ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`group relative overflow-hidden rounded-2xl border p-8 md:p-10 transition-all duration-300 ${
                  plan.highlighted ? "lg:-mt-4 lg:pb-12 lg:pt-12" : ""
                }`}
                style={{
                  borderColor: plan.highlighted ? "hsl(270 100% 50% / 0.5)" : "hsl(260 15% 18%)",
                  background: plan.highlighted
                    ? "linear-gradient(180deg, hsl(260 35% 14%) 0%, hsl(260 30% 9%) 100%)"
                    : "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 25% 8%) 100%)",
                }}
              >
                {plan.highlighted && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{ background: "radial-gradient(ellipse at top center, hsl(270 100% 50%) 0%, transparent 60%)" }}
                  />
                )}

                <div className="relative">
                  {plan.badge && (
                    <div className="mb-5">
                      <Badge className="gradient-primary-vibrant border-0 px-5 py-1.5 text-sm font-bold text-primary-foreground shadow-lg">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <h3 className={`font-display text-3xl md:text-4xl font-bold text-foreground ${plan.highlighted ? "text-gradient-primary" : ""}`}>
                    Plan {plan.name}
                  </h3>
                  <p className="mt-3 text-base md:text-lg leading-relaxed text-muted-foreground">{plan.tagline}</p>

                  {/* Pricing */}
                  <div className="mt-8 space-y-3">
                    <div>
                      <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Setup</span>
                      <p className="font-display text-3xl md:text-4xl font-bold text-foreground">
                        {plan.setup} <span className="text-base font-normal text-muted-foreground">COP</span>
                      </p>
                    </div>
                    <div
                      className="rounded-xl px-5 py-4"
                      style={{
                        background: plan.highlighted ? "hsl(270 100% 50% / 0.08)" : "hsl(260 20% 12%)",
                        border: plan.highlighted ? "1px solid hsl(270 100% 50% / 0.2)" : "1px solid hsl(260 15% 16%)",
                      }}
                    >
                      <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Mensual</span>
                      <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
                        {plan.monthly} <span className="text-sm font-normal text-muted-foreground">{plan.monthlyLabel}</span>
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-8">
                    {plan.includesFrom && (
                      <p className="mb-4 text-sm font-semibold text-primary">{plan.includesFrom}</p>
                    )}
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-base md:text-lg text-foreground">
                          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary icon-neon" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className={`mt-10 w-full text-base font-bold uppercase tracking-wide ${
                      plan.highlighted
                        ? "gradient-primary-vibrant cta-pulse btn-glow border-0 text-primary-foreground"
                        : "border-primary/30 bg-transparent text-foreground hover:bg-primary/10"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
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
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { icon: Receipt, text: "Facturación en pesos colombianos" },
              { icon: ShieldCheck, text: "Sin costos ocultos" },
              { icon: ScaleIcon, text: "Escalable según tu negocio" },
            ].map((item) => (
              <span key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="h-4 w-4 text-primary" />
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Confidence Block ─── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Target className="mx-auto mb-5 h-8 w-8 text-primary icon-neon" />
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Tus pantallas deberían vender,{" "}
            <span className="text-gradient-primary">no solo mostrar.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Visualia transforma tus pantallas en herramientas activas de venta que influyen en la decisión del cliente mientras compra.
          </p>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="relative overflow-hidden rounded-2xl border px-8 py-16 md:px-16"
            style={{
              borderColor: "hsl(270 100% 50% / 0.2)",
              background: "linear-gradient(180deg, hsl(260 25% 14%) 0%, hsl(260 30% 8%) 100%)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50%) 0%, transparent 70%)" }} />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Empieza a vender más desde tu propia pantalla.
              </h2>
              <Button
                size="lg"
                className="mt-8 gradient-primary-vibrant cta-pulse btn-glow border-0 px-10 text-lg font-bold uppercase tracking-wide text-primary-foreground"
                onClick={() => setChatOpen(true)}
              >
                Hablar con un experto
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/20 px-6 py-8">
        <p className="text-center text-xs text-muted-foreground/50">
          © 2026 Visualia. Todos los derechos reservados.
        </p>
      </footer>

      <ExpertChat open={chatOpen} onOpenChange={setChatOpen} />
    </PremiumBackground>
  );
};

export default Studio;
