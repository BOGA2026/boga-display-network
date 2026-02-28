import { useState } from "react";
import PremiumBackground from "@/components/layout/PremiumBackground";
import LandingHeader from "@/components/landing/LandingHeader";
import ExpertChat from "@/components/landing/ExpertChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Check,
  TrendingUp,
  Target,
  ShieldCheck,
  BarChart3,
  Clock,
  Crown,
  Zap,
  Sparkles,
  Layers,
} from "lucide-react";

const plans = [
  {
    id: "impulso",
    name: "Impulso",
    tagline: "Ideal para empezar a vender con pantallas digitales.",
    setup: "$1.500.000",
    monthly: "$350.000",
    highlighted: false,
    badge: null,
    benefits: [
      "Aumenta ventas por impulso",
      "Productos destacados estratégicamente",
      "Pantallas trabajando sin intervención",
    ],
    features: [
      "Diseño inicial de menú digital (hasta 15 productos)",
      "1 sesión fotográfica básica (8–12 productos)",
      "Adaptación a formato pantalla",
      "1 actualización mensual",
    ],
  },
  {
    id: "crecimiento",
    name: "Crecimiento",
    tagline: "Optimiza tu menú y aumenta ventas automáticamente.",
    setup: "$3.500.000",
    monthly: "$890.000",
    highlighted: true,
    badge: "MÁS ELEGIDO POR RESTAURANTES",
    benefits: [
      "Aumenta ventas por impulso",
      "Promociones automáticas",
      "Productos destacados estratégicamente",
      "Pantallas trabajando sin intervención",
    ],
    features: [
      "Diseño completo menú (hasta 40 productos)",
      "Fotografía profesional completa",
      "Adaptación vertical + horizontal",
      "Animaciones para promociones",
      "Estrategia visual por franja horaria",
      "2 actualizaciones mensuales",
    ],
  },
  {
    id: "dominio",
    name: "Dominio",
    tagline: "Estandariza y controla todas tus sedes desde un solo lugar.",
    setup: "Desde $6.500.000",
    monthly: "Desde $1.900.000",
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
      "Producción visual integral",
      "Sesión avanzada (hasta 60 productos)",
      "Videos cortos promocionales",
      "Rediseño trimestral",
      "Campañas estacionales",
      "Actualizaciones ilimitadas",
    ],
  },
];

const trustPoints = [
  { icon: TrendingUp, text: "+30% en ticket promedio reportado por nuestros clientes" },
  { icon: Clock, text: "Actualiza tu menú en menos de 30 segundos" },
  { icon: ShieldCheck, text: "Sin contratos de permanencia" },
  { icon: BarChart3, text: "Mide qué productos venden más" },
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

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Aumenta tu ticket promedio mostrando el contenido correcto en el momento correcto.
          </p>
        </div>
      </section>

      {/* ─── Plans ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Planes <span className="text-gradient-primary">Visualia Studio</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Inversión estratégica en contenido que genera retorno medible.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`group relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:scale-[1.02] ${
                  plan.highlighted ? "lg:-mt-4 lg:pb-10 lg:pt-10" : ""
                }`}
                style={{
                  borderColor: plan.highlighted ? "hsl(270 100% 50% / 0.5)" : "hsl(260 15% 18%)",
                  background: plan.highlighted
                    ? "linear-gradient(180deg, hsl(260 35% 14%) 0%, hsl(260 30% 9%) 100%)"
                    : "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 25% 8%) 100%)",
                }}
              >
                {/* Glow overlay */}
                {plan.highlighted && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{ background: "radial-gradient(ellipse at top center, hsl(270 100% 50%) 0%, transparent 60%)" }}
                  />
                )}

                <div className="relative">
                  {/* Badge */}
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
                  <p className="mt-2 text-base md:text-lg text-muted-foreground">{plan.tagline}</p>

                  {/* Pricing */}
                  <div className="mt-8 space-y-3">
                    <div>
                      <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Setup</span>
                      <p className="font-display text-3xl md:text-4xl font-bold text-foreground">
                        {plan.setup} <span className="text-base font-normal text-muted-foreground">COP</span>
                      </p>
                    </div>
                    <div
                      className="rounded-lg px-5 py-4"
                      style={{
                        background: plan.highlighted ? "hsl(270 100% 50% / 0.08)" : "hsl(260 20% 12%)",
                        border: plan.highlighted ? "1px solid hsl(270 100% 50% / 0.2)" : "1px solid hsl(260 15% 16%)",
                      }}
                    >
                      <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Mensual</span>
                      <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
                        {plan.monthly} <span className="text-base font-normal text-muted-foreground">COP/mes</span>
                      </p>
                    </div>
                  </div>

                  {/* Results first */}
                  <div className="mt-8">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Resultados</p>
                    <ul className="space-y-3">
                      {plan.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-base md:text-lg text-foreground">
                          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary icon-neon" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technical in lower hierarchy */}
                  <div className="mt-8 border-t border-border/20 pt-6">
                    <p className="mb-4 text-sm text-muted-foreground/70 uppercase tracking-wider">Incluye</p>
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className={`mt-8 w-full text-base ${
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
          <p className="mx-auto mt-8 max-w-md text-center text-sm text-muted-foreground/60">
            Sin costos ocultos. Facturación en pesos colombianos.
          </p>
        </div>
      </section>

      {/* ─── Trust Points ─── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((tp) => (
              <div key={tp.text} className="flex items-center gap-3 glass-card rounded-xl px-5 py-4 transition-all duration-300 hover-lift">
                <tp.icon className="h-5 w-5 flex-shrink-0 text-primary icon-neon" />
                <span className="text-sm font-medium text-foreground">{tp.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROI Section ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <TrendingUp className="mx-auto mb-5 h-10 w-10 text-primary" />
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              ¿Por qué invertir en{" "}
              <span className="text-gradient-primary">contenido profesional</span>?
            </h2>
          </div>

          <div
            className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border px-8 py-14 md:px-14"
            style={{
              borderColor: "hsl(270 100% 50% / 0.3)",
              background: "linear-gradient(180deg, hsl(260 30% 12%) 0%, hsl(260 25% 7%) 100%)",
              boxShadow: "0 0 60px -12px hsl(270 100% 50% / 0.2)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-10" style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50%) 0%, transparent 70%)" }} />
            <div className="relative space-y-6 text-center">
              <p className="font-display text-2xl font-bold leading-snug text-foreground md:text-3xl">
                Porque las pantallas no venden solas.
                <br />
                <span className="text-gradient-primary">El diseño correcto sí.</span>
              </p>
              <div className="mx-auto max-w-xl space-y-2 text-base leading-relaxed text-muted-foreground md:text-lg">
                <p>Si aumentas tu ticket promedio apenas <span className="font-bold text-foreground">$2.000 pesos</span></p>
                <p>y vendes <span className="font-bold text-foreground">50 platos al día</span>,</p>
                <p>eso puede significar más de</p>
                <p className="font-display text-3xl font-bold text-gradient-primary md:text-4xl">$3 millones adicionales al mes.</p>
              </div>
              <div className="mx-auto mt-4 w-fit rounded-lg border px-6 py-3" style={{ borderColor: "hsl(270 100% 50% / 0.2)", background: "hsl(270 100% 50% / 0.06)" }}>
                <p className="text-sm font-semibold text-foreground/80">
                  No es teoría. <span className="text-gradient-primary">Es comportamiento de compra.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Benefits grid */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Sparkles, title: "Más impacto visual", desc: "Tu producto se ve más apetitoso y más deseable." },
              { icon: Zap, title: "Menos fricción", desc: "El cliente decide más rápido y pregunta menos." },
              { icon: Layers, title: "Más visibilidad estratégica", desc: "Promociones y productos clave reciben atención real." },
              { icon: TrendingUp, title: "Más ticket promedio", desc: "Pequeños ajustes visuales generan ingresos sostenidos." },
            ].map((b) => (
              <div
                key={b.title}
                className="group rounded-xl border p-6 text-center transition-all hover:border-primary/40 hover:shadow-[0_0_30px_-8px_hsl(270_100%_50%/0.15)]"
                style={{ borderColor: "hsl(260 15% 18%)", background: "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 25% 8%) 100%)" }}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
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
            Visualia diseña y gestiona el contenido de tus pantallas para influir en la decisión de compra del cliente dentro del local.
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
