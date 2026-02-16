import { useState } from "react";
import PremiumBackground from "@/components/layout/PremiumBackground";
import {
  Camera,
  LayoutGrid,
  Sparkles,
  MonitorSmartphone,
  Clock,
  RefreshCw,
  ArrowRight,
  Crown,
  Zap,
  Layers,
  CalendarClock,
  Wifi,
  Check,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandingHeader from "@/components/landing/LandingHeader";
import VisualiaStudioForm from "@/components/landing/VisualiaStudioForm";

type StudioTier = "studio_start" | "studio_pro" | "studio_elite";

const services = [
  { icon: Camera, title: "Fotografía gastronómica profesional", desc: "Sesiones de foto con estilismo culinario, iluminación de estudio y edición premium para que cada plato luzca irresistible en pantalla." },
  { icon: LayoutGrid, title: "Diseño de menú digital optimizado", desc: "Jerarquía visual clara, tipografía legible a distancia y diseño pensado para decisiones rápidas del cliente." },
  { icon: Sparkles, title: "Piezas visuales para promociones", desc: "Creatividades de temporada, lanzamientos y ofertas especiales con animaciones sutiles que captan la atención." },
  { icon: MonitorSmartphone, title: "Adaptaciones multi-formato", desc: "Cada pieza se produce en vertical y horizontal, optimizada para cualquier tipo de pantalla o ubicación." },
  { icon: Clock, title: "Estrategia visual por franjas horarias", desc: "Contenido diferenciado para desayuno, almuerzo y cena que maximiza la relevancia y el ticket promedio." },
  { icon: RefreshCw, title: "Producción mensual opcional", desc: "Actualizaciones periódicas de contenido para mantener la frescura visual y la rotación de productos destacados." },
];

const integrationPoints = [
  { icon: Layers, title: "Optimizado para Visualia", desc: "Todo el contenido se produce en formatos y resoluciones perfectas para el reproductor Visualia." },
  { icon: CalendarClock, title: "Programable por horario", desc: "Cada pieza se entrega lista para asignar a franjas horarias en el programador de Visualia." },
  { icon: Wifi, title: "Distribución automática", desc: "Una vez publicado, el contenido se sincroniza en todas tus pantallas sin intervención manual." },
];

const plans = [
  {
    id: "studio_start" as StudioTier,
    name: "Studio Start",
    audience: "Para restaurantes pequeños (1–2 pantallas)",
    setup: "$1.500.000",
    monthly: "$350.000",
    prefix: "",
    features: [
      "Diseño inicial de menú digital (hasta 15 productos)",
      "1 sesión fotográfica básica (8–12 productos)",
      "Adaptación a formato pantalla",
      "1 actualización mensual",
    ],
    highlighted: false,
    cta: "Solicitar Studio Start",
  },
  {
    id: "studio_pro" as StudioTier,
    name: "Studio Pro",
    audience: "Para restaurantes consolidados",
    setup: "$3.500.000",
    monthly: "$890.000",
    prefix: "",
    features: [
      "Diseño completo menú (hasta 40 productos)",
      "Fotografía profesional completa",
      "Adaptación vertical + horizontal",
      "Animaciones simples para promociones",
      "Estrategia visual por franja horaria",
      "2 actualizaciones mensuales",
    ],
    highlighted: true,
    cta: "Solicitar Studio Pro",
    badge: "Más elegido",
  },
  {
    id: "studio_elite" as StudioTier,
    name: "Studio Elite",
    audience: "Para marcas multi-sede",
    setup: "Desde $6.500.000",
    monthly: "Desde $1.900.000",
    prefix: "",
    features: [
      "Producción visual integral",
      "Sesión avanzada (hasta 60 productos)",
      "Videos cortos promocionales",
      "Rediseño trimestral",
      "Campañas estacionales",
      "Actualizaciones ilimitadas",
    ],
    highlighted: false,
    cta: "Solicitar Studio Elite",
  },
];

const Studio = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedTier, setSelectedTier] = useState<StudioTier>("studio_pro");

  const openFormWithTier = (tier: StudioTier) => {
    setSelectedTier(tier);
    setShowForm(true);
  };

  return (
    <PremiumBackground>
      <LandingHeader />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-36 md:pt-44">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{ width: 900, height: 700 }}
        >
          <div
            className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
            style={{ background: "#8A00FF" }}
          />
          <div
            className="absolute left-1/3 top-48 h-56 w-56 rounded-full opacity-15 blur-[90px]"
            style={{ background: "#C000FF" }}
          />
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
            Servicio Premium
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Producción visual premium para{" "}
            <span className="text-gradient-primary">pantallas que venden.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            El contenido correcto puede aumentar tu ticket promedio. Nosotros lo diseñamos estratégicamente.
          </p>
        </div>
      </section>

      {/* ─── Pricing Plans ─── */}
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
                className={`group relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:scale-105 ${
                  plan.highlighted
                    ? "lg:-mt-4 lg:mb-0 lg:pb-10 lg:pt-10"
                    : ""
                }`}
                style={{
                  borderColor: plan.highlighted
                    ? "hsl(270 100% 50% / 0.5)"
                    : "hsl(260 15% 18%)",
                  background: plan.highlighted
                    ? "linear-gradient(180deg, hsl(260 35% 14%) 0%, hsl(260 30% 9%) 100%)"
                    : "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 25% 8%) 100%)",
                  boxShadow: "0 0 0 rgba(138, 0, 255, 0)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 50px -8px hsl(270 100% 50% / 0.4), 0 0 20px -4px hsl(270 100% 50% / 0.2)";
                  e.currentTarget.style.borderColor = plan.highlighted ? "hsl(270 100% 50% / 0.6)" : "hsl(270 100% 50% / 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 rgba(138, 0, 255, 0)";
                  e.currentTarget.style.borderColor = plan.highlighted ? "hsl(270 100% 50% / 0.5)" : "hsl(260 15% 18%)";
                }}
              >
                {/* Glow overlay for highlighted */}
                {plan.highlighted && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{
                      background:
                        "radial-gradient(ellipse at top center, hsl(270 100% 50%) 0%, transparent 60%)",
                    }}
                  />
                )}

                <div className="relative">
                  {/* Badge */}
                  {plan.badge && (
                    <div className="mb-4 flex items-center gap-2">
                      <Badge className="gradient-primary border-0 px-3 py-1 text-xs text-primary-foreground">
                        <Star className="mr-1 h-3 w-3" />
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Plan name */}
                  <h3
                    className={`font-display text-2xl font-bold text-foreground ${
                      plan.highlighted ? "text-gradient-primary" : ""
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.audience}
                  </p>

                  {/* Pricing */}
                  <div className="mt-6 space-y-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Setup
                      </span>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {plan.setup}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          COP
                        </span>
                      </p>
                    </div>
                    <div
                      className="rounded-lg px-4 py-3"
                      style={{
                        background: plan.highlighted
                          ? "hsl(270 100% 50% / 0.08)"
                          : "hsl(260 20% 12%)",
                        border: plan.highlighted
                          ? "1px solid hsl(270 100% 50% / 0.2)"
                          : "1px solid hsl(260 15% 16%)",
                      }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Mensual
                      </span>
                      <p className="font-display text-xl font-bold text-foreground">
                        {plan.monthly}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          COP/mes
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: "hsl(270 100% 65%)" }}
                        />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className={`mt-8 w-full text-base ${
                      plan.highlighted
                        ? "gradient-primary glow-primary border-0 text-primary-foreground"
                        : "border-primary/30 bg-transparent text-foreground hover:bg-primary/10"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => openFormWithTier(plan.id)}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROI Section ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          {/* Section title */}
          <div className="mb-16 text-center">
            <TrendingUp className="mx-auto mb-5 h-10 w-10 text-primary" />
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              ¿Por qué invertir en{" "}
              <span className="text-gradient-primary">contenido profesional</span>?
            </h2>
          </div>

          {/* Main highlight box */}
          <div
            className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border px-8 py-14 md:px-14 animate-fade-in"
            style={{
              borderColor: "hsl(270 100% 50% / 0.3)",
              background:
                "linear-gradient(180deg, hsl(260 30% 12%) 0%, hsl(260 25% 7%) 100%)",
              boxShadow: "0 0 60px -12px hsl(270 100% 50% / 0.2), 0 0 24px -6px hsl(270 100% 50% / 0.15)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(270 100% 50%) 0%, transparent 70%)",
              }}
            />
            <div className="relative space-y-6 text-center">
              <p className="font-display text-2xl font-bold leading-snug text-foreground md:text-3xl">
                Porque las pantallas no venden solas.
                <br />
                <span className="text-gradient-primary">El diseño correcto sí.</span>
              </p>

              <div className="mx-auto max-w-xl space-y-2 text-base leading-relaxed text-muted-foreground md:text-lg">
                <p>
                  Si aumentas tu ticket promedio apenas{" "}
                  <span className="font-bold text-foreground">$2.000 pesos</span>
                </p>
                <p>
                  y vendes{" "}
                  <span className="font-bold text-foreground">50 platos al día</span>,
                </p>
                <p>
                  eso puede significar más de
                </p>
                <p className="font-display text-3xl font-bold text-gradient-primary md:text-4xl">
                  $3 millones adicionales al mes.
                </p>
              </div>

              <div
                className="mx-auto mt-4 w-fit rounded-lg border px-6 py-3"
                style={{
                  borderColor: "hsl(270 100% 50% / 0.2)",
                  background: "hsl(270 100% 50% / 0.06)",
                }}
              >
                <p className="text-sm font-semibold text-foreground/80">
                  No es teoría.{" "}
                  <span className="text-gradient-primary">Es comportamiento de compra.</span>
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
                style={{
                  borderColor: "hsl(260 15% 18%)",
                  background: "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 25% 8%) 100%)",
                }}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Closing statement */}
          <div className="mx-auto mt-16 max-w-2xl text-center">
            <p className="font-display text-xl font-bold leading-snug text-foreground md:text-2xl">
              No es diseño.
              <br />
              <span className="text-gradient-primary">Es estrategia comercial aplicada a tus pantallas.</span>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Cada segundo frente al cliente es una oportunidad para vender más.
            </p>
          </div>
        </div>
      </section>

      {/* ─── What We Do ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Qué hacemos por tu marca
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Producción de contenido premium diseñada específicamente para pantallas de señalización digital.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.title}
                className="group relative overflow-hidden rounded-xl border p-8 transition-all hover:border-primary/40"
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
                <div className="relative">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Integration with Software ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Integrado con <span className="text-gradient-primary">Visualia</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Todo el contenido producido está listo para funcionar en tu ecosistema Visualia sin configuración adicional.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {integrationPoints.map((ip) => (
              <div
                key={ip.title}
                className="group rounded-xl border p-8 text-center transition-all hover:border-primary/40 hover:shadow-[0_0_30px_-8px_hsl(270_100%_50%/0.2)]"
                style={{
                  borderColor: "hsl(260 15% 18%)",
                  background:
                    "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 25% 10%) 100%)",
                }}
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
                  <ip.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                  {ip.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{ip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="relative overflow-hidden rounded-2xl border px-8 py-16 md:px-16"
            style={{
              borderColor: "hsl(270 100% 50% / 0.2)",
              background:
                "linear-gradient(180deg, hsl(260 25% 14%) 0%, hsl(260 30% 8%) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at center, #8A00FF 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <Crown className="mx-auto mb-4 h-8 w-8 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                ¿Quieres que tus pantallas{" "}
                <span className="text-gradient-primary">vendan más</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Solicita una asesoría premium y descubre cómo el contenido profesional puede transformar tus resultados.
              </p>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="gradient-primary glow-primary border-0 px-8 text-lg text-primary-foreground"
                  onClick={() => openFormWithTier("studio_pro")}
                >
                  Solicitar asesoría premium
                  <ArrowRight className="ml-2 h-5 w-5" />
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

      <VisualiaStudioForm
        open={showForm}
        onOpenChange={setShowForm}
        defaultTier="studio"
        selectedStudioPlan={selectedTier}
      />
    </PremiumBackground>
  );
};

export default Studio;
