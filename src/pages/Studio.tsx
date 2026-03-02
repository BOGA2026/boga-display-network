import { useState } from "react";
import PremiumBackground from "@/components/layout/PremiumBackground";
import LandingHeader from "@/components/landing/LandingHeader";
import ExpertChat from "@/components/landing/ExpertChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Check,
  Monitor,
  Paintbrush,
  Star,
  Receipt,
  ShieldCheck,
  ScaleIcon,
} from "lucide-react";

const plans = [
  {
    id: "impulso",
    name: "Impulso Visual",
    ideal: "Restaurantes que inician con menú digital profesional.",
    setup: "$990.000",
    monthly: "$290.000",
    monthlyLabel: "COP / mes",
    highlighted: false,
    badge: null,
    includesFrom: null,
    features: [
      "Diseño de carta digital",
      "Adaptación a pantallas",
      "Configuración visual inicial",
      "Programación básica",
      "1 actualización mensual",
      "Soporte creativo",
    ],
  },
  {
    id: "crecimiento",
    name: "Crecimiento Comercial",
    ideal: "Negocios que quieren vender más activamente.",
    setup: "$2.900.000",
    monthly: "$690.000",
    monthlyLabel: "COP / mes",
    highlighted: true,
    badge: "MÁS ELEGIDO POR RESTAURANTES",
    includesFrom: "Todo lo de Impulso Visual más:",
    features: [
      "Rediseño estratégico del menú",
      "Fotografías optimizadas",
      "Animaciones promocionales",
      "Programación automática por horarios",
      "Promociones destacadas",
      "2 actualizaciones mensuales",
      "Optimización continua",
    ],
  },
  {
    id: "dominio",
    name: "Dominio de Marca",
    ideal: "Cadenas o marcas en expansión.",
    setup: "Desde $5.900.000",
    monthly: "Desde $1.490.000",
    monthlyLabel: "COP / mes",
    highlighted: false,
    badge: null,
    includesFrom: "Todo lo de Crecimiento Comercial más:",
    features: [
      "Gestión multi-sede",
      "Producción audiovisual",
      "Campañas comerciales",
      "Videos promocionales",
      "Actualizaciones ilimitadas",
      "Estrategia visual continua",
      "Prioridad en soporte",
    ],
  },
];

const Studio = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <PremiumBackground>
      <LandingHeader />

      {/* ─── BLOCK 1: Visualia Software Reference ─── */}
      <section className="relative px-6 pt-36 md:pt-44">
        <div className="mx-auto max-w-3xl">
          <div
            className="flex items-start gap-4 rounded-xl border px-6 py-5"
            style={{
              borderColor: "hsl(260 15% 22%)",
              background: "hsl(260 20% 10% / 0.6)",
            }}
          >
            <Monitor className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Ya controlas tus pantallas con Visualia
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                La plataforma Visualia te permite administrar tus pantallas remotamente desde la nube.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BLOCK 2: Visualia Studio ─── */}
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-10 pt-16 md:pt-20">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 900, height: 600 }}>
          <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full opacity-15 blur-[120px]" style={{ background: "hsl(270 100% 50%)" }} />
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
            <Paintbrush className="h-4 w-4" />
            Servicio de creación de contenido
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Ahora hagamos que tus pantallas{" "}
            <span className="text-gradient-primary">realmente vendan.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Visualia Studio es nuestro servicio especializado de creación de contenido para pantallas digitales.
          </p>
        </div>
      </section>

      {/* ─── Explanation Card ─── */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <div
            className="rounded-2xl border p-8 text-center md:p-10"
            style={{
              borderColor: "hsl(270 100% 50% / 0.15)",
              background: "linear-gradient(180deg, hsl(260 30% 12%) 0%, hsl(260 25% 9%) 100%)",
            }}
          >
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              Este es un <span className="font-semibold text-foreground">servicio adicional</span> a la plataforma Visualia.
              <br />
              Aquí no pagas por pantallas.
              <br />
              Nos enfocamos en diseñar el contenido que verán tus clientes para{" "}
              <span className="font-semibold text-foreground">mejorar su decisión de compra.</span>
            </p>

            <div
              className="mx-auto mt-8 max-w-lg rounded-xl border px-6 py-5"
              style={{
                borderColor: "hsl(270 100% 50% / 0.3)",
                background: "hsl(270 100% 50% / 0.06)",
              }}
            >
              <p className="text-lg font-bold leading-snug text-foreground md:text-xl">
                No importa si tienes 1 o 100 pantallas.
                <br />
                <span className="text-gradient-primary">Lo importante es qué muestran.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pre-plans context ─── */}
      <section className="px-6 pb-6 pt-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Visualia Studio desarrolla el <span className="font-semibold text-foreground">concepto visual, diseño y estrategia de contenido</span> para tus menús digitales y promociones.
          </p>
        </div>
      </section>

      {/* ─── Plans ─── */}
      <section className="px-6 py-16 md:py-20">
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
                      <Badge className="gradient-primary-vibrant border-0 px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
                        <Star className="mr-1.5 h-3 w-3" />
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <h3 className={`font-display text-2xl font-bold text-foreground md:text-3xl ${plan.highlighted ? "text-gradient-primary" : ""}`}>
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/70">Ideal para:</span>{" "}
                    {plan.ideal}
                  </p>

                  {/* Pricing */}
                  <div className="mt-7 space-y-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Inversión inicial</span>
                      <p className="font-display text-2xl font-bold text-foreground md:text-3xl">
                        {plan.setup} <span className="text-sm font-normal text-muted-foreground">COP</span>
                      </p>
                    </div>
                    <div
                      className="rounded-xl px-5 py-4"
                      style={{
                        background: plan.highlighted ? "hsl(270 100% 50% / 0.08)" : "hsl(260 20% 12%)",
                        border: plan.highlighted ? "1px solid hsl(270 100% 50% / 0.2)" : "1px solid hsl(260 15% 16%)",
                      }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Servicio mensual</span>
                      <p className="font-display text-xl font-bold text-foreground md:text-2xl">
                        {plan.monthly} <span className="text-xs font-normal text-muted-foreground">{plan.monthlyLabel}</span>
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-7">
                    {plan.includesFrom && (
                      <p className="mb-3 text-xs font-semibold text-primary">{plan.includesFrom}</p>
                    )}
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-foreground md:text-base">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className={`mt-8 w-full text-sm font-bold ${
                      plan.highlighted
                        ? "gradient-primary-vibrant cta-pulse btn-glow border-0 text-primary-foreground"
                        : "border-primary/30 bg-transparent text-foreground hover:bg-primary/10"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => setChatOpen(true)}
                  >
                    Quiero mejorar mis pantallas
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
              <span key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                <item.icon className="h-4 w-4 text-primary" />
                {item.text}
              </span>
            ))}
          </div>
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
            <div className="pointer-events-none absolute inset-0 opacity-15" style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50%) 0%, transparent 70%)" }} />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Empieza a vender más desde tu propia pantalla.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
                Hablemos sobre cómo mejorar el contenido de tus pantallas.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-10 text-base font-bold text-primary-foreground"
                  onClick={() => setChatOpen(true)}
                >
                  Quiero mejorar mis pantallas
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/30 bg-transparent text-foreground hover:bg-primary/10"
                  onClick={() => setChatOpen(true)}
                >
                  Asesoría personalizada
                </Button>
              </div>
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
