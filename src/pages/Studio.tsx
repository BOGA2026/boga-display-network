import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PremiumBackground from "@/components/layout/PremiumBackground";
import LandingHeader from "@/components/landing/LandingHeader";
import LegalFooter from "@/components/landing/LegalFooter";
import ExpertChat from "@/components/landing/ExpertChat";
import { BeforeAfter, STUDIO_CASES } from "@/components/studio/BeforeAfter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  ChevronDown,
  Info,
  Minus,
} from "lucide-react";
import {
  STUDIO_PLANS,
  STUDIO_COMPARISON,
} from "@/config/studioPlans";
import { STUDIO_STEPS, STUDIO_FAQ } from "@/config/studioContent";
import Seo from "@/components/Seo";


const Studio = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [headlineVisible, setHeadlineVisible] = useState(false);
  const headlineRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeadlineVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Visualia Studio",
    serviceType: "Diseño de contenido para pantallas digitales (digital signage)",
    provider: {
      "@type": "Organization",
      name: "Visualia",
      url: "https://visualiamedia.com",
    },
    areaServed: { "@type": "Country", name: "Colombia" },
    description:
      "Servicio de diseño, producción y estrategia visual para menús digitales y promociones en pantallas de restaurantes y negocios físicos.",
    offers: STUDIO_PLANS.map((p) => ({
      "@type": "Offer",
      name: p.name,
      priceCurrency: "COP",
      description: `${p.ideal} Inversión inicial: ${p.setup.display}. Mensualidad: ${p.monthly.display} ${p.monthly.unitLabel}.`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: STUDIO_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };



  return (
    <PremiumBackground>
      <Seo
        title="Visualia Studio | Diseño de contenido para pantallas de restaurantes"
        description="Nuestro equipo diseña tu carta digital, promociones y campañas para que tus pantallas vendan más. Planes desde $99.000/mes."
        path="/studio"
        jsonLd={[serviceJsonLd, faqJsonLd]}
      />

      <LandingHeader />

      <div className="studio-shell">

      {/* ─── BLOCK 1: Plataforma vs Studio ─── */}
      <section className="relative px-6 pt-36 md:pt-44">
        <div className="mx-auto max-w-4xl">
          <p className="studio-on-light mb-6 text-center text-sm text-muted-foreground md:text-base">
            La plataforma es el escenario;{" "}
            <span className="font-semibold text-foreground">Studio es el show.</span>
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Plataforma */}
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: "hsl(260 15% 22%)",
                background: "hsl(260 20% 10% / 0.6)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Plataforma Visualia
                </span>
              </div>
              <p className="text-base font-semibold leading-snug text-foreground">
                El sistema que muestra tu menú en las pantallas.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Desde $50.000 / pantalla / mes.
              </p>
              <Link
                to="/precios"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Ver la plataforma
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Studio */}
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: "hsl(270 100% 50% / 0.4)",
                background: "linear-gradient(180deg, hsl(260 30% 12%) 0%, hsl(260 25% 9%) 100%)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Paintbrush className="h-5 w-5" style={{ color: "hsl(280 100% 75%)" }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(280 100% 75%)" }}>
                  Visualia Studio
                </span>
              </div>
              <p className="text-base font-semibold leading-snug text-foreground">
                El equipo de diseño que crea lo que se muestra: tu carta, promociones y campañas.
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground/80">
                Estás aquí
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

        <div className="studio-on-light relative mx-auto max-w-4xl text-center">
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
            <span
              ref={headlineRef}
              className={cn(
                "headline-fragment",
                headlineVisible && "is-visible"
              )}
            >
              Ahora hagamos que tus pantallas{" "}
            </span>
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
              Studio <span className="font-semibold text-foreground">no reemplaza tu suscripción a la plataforma</span>: es el equipo creativo que diseña lo que tus clientes ven en pantalla —{" "}
              <span className="font-semibold text-foreground">carta, promociones y campañas</span>— para que decidan comprar más.
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
        <div className="studio-on-light mx-auto max-w-3xl text-center">
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Visualia Studio desarrolla el <span className="font-semibold text-foreground">concepto visual, diseño y estrategia de contenido</span> para tus menús digitales y promociones.
          </p>
        </div>
      </section>

      {/* ─── Portafolio Antes / Después ─── */}
      <section className="px-6 py-16 md:py-20" id="antes-despues">
        <div className="mx-auto max-w-5xl">
          <div className="studio-on-light mb-10 text-center">
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Así se ve la diferencia
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              Mismos platos, misma pantalla. Solo cambió el diseño.
            </p>
          </div>

          {STUDIO_CASES.length === 0 ? (
            <div
              className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border/50 px-6 py-10 text-center"
              style={{ background: "hsl(260 20% 10% / 0.4)" }}
            >
              <p className="text-sm text-muted-foreground">
                Estamos publicando los primeros casos reales de nuestro programa piloto. Muy pronto verás aquí las pantallas antes y después de pasar por Visualia Studio.
              </p>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-1">
              {STUDIO_CASES.map((c) => (
                <BeforeAfter key={c.label} c={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Plans ─── */}
      <section className="px-6 py-16 md:py-20">

        <div className="mx-auto max-w-7xl">
          <div className="studio-on-light mb-10 text-center">
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Elige tu plan
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              Todos incluyen concepto, diseño y ajustes. La suscripción a la plataforma se contrata aparte.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
            {STUDIO_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`group relative overflow-hidden rounded-2xl border p-8 md:p-10 transition-all duration-300 ${
                  plan.highlighted ? "lg:-mt-4 lg:pb-12 lg:pt-12" : ""
                }`}
                style={{
                  borderColor: plan.highlighted ? "hsl(270 100% 60% / 0.55)" : "hsl(260 18% 26%)",
                  background: plan.highlighted
                    ? "linear-gradient(180deg, hsl(260 35% 15%) 0%, hsl(260 30% 10%) 100%)"
                    : "linear-gradient(180deg, hsl(260 26% 13%) 0%, hsl(260 24% 10%) 100%)",
                  boxShadow: plan.highlighted
                    ? "0 0 0 1px hsl(270 100% 60% / 0.25), 0 24px 60px -20px hsl(270 100% 50% / 0.45)"
                    : "0 12px 32px -24px hsl(260 40% 4% / 0.9)",
                }}

              >
                {plan.highlighted && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{ background: "radial-gradient(ellipse at top center, hsl(270 100% 50%) 0%, transparent 60%)" }}
                  />
                )}

                <div className="relative">
                  {/* Badge slot — reserva altura en todas las tarjetas para alinear títulos */}
                  <div className="mb-5 flex min-h-[32px] items-center" aria-hidden={!plan.badge}>
                    {plan.badge ? (
                      <Badge className="gradient-primary-vibrant border-0 px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
                        <Star className="mr-1.5 h-3 w-3" />
                        {plan.badge}
                      </Badge>
                    ) : null}
                  </div>

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
                      <p className="font-display text-2xl font-bold text-foreground md:text-3xl leading-tight">
                        <span className="whitespace-nowrap">{plan.setup.display}</span>{" "}
                        <span className="text-sm font-normal text-muted-foreground">COP</span>
                      </p>

                      {/* Expandible: ¿Qué cubre este valor? */}
                      <details className="group/details mt-2 rounded-lg border border-border/40 bg-black/20 open:bg-black/30">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5" />
                            ¿Qué cubre este valor?
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open/details:rotate-180" />
                        </summary>
                        <div className="border-t border-border/40 px-3 py-3">
                          <ul className="space-y-1.5">
                            {plan.setup.breakdown.map((item) => (
                              <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                                {item}
                              </li>
                            ))}
                          </ul>
                          {plan.setup.variesBy && (
                            <p className="mt-3 text-xs italic text-muted-foreground/80">
                              {plan.setup.variesBy}
                            </p>
                          )}
                          <p className="mt-3 border-t border-border/30 pt-2 text-xs text-foreground/70">
                            {plan.setup.installments}
                          </p>
                        </div>
                      </details>
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
                        {plan.monthly.display}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {plan.monthly.unitLabel}
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

                  {/* Monthly detail */}
                  {plan.monthlyDetail && (
                    <div className="mt-6">
                      <div
                        className="rounded-xl px-5 py-4"
                        style={{
                          background: "hsl(260 20% 12%)",
                          border: "1px solid hsl(260 15% 20%)",
                        }}
                      >
                        {plan.monthlyDetail.title && (
                          <>
                            <p className="text-sm font-semibold text-foreground mb-2">
                              Tu mensualidad incluye:
                            </p>
                            <p className="text-sm font-medium text-foreground/90 mb-2">
                              {plan.monthlyDetail.title}
                            </p>
                          </>
                        )}
                        {plan.monthlyDetail.options.length > 0 && (
                          <ul className="space-y-1.5 ml-1">
                            {plan.monthlyDetail.options.map((opt: string) => (
                              <li key={opt} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60" />
                                {opt}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className={`text-xs text-muted-foreground/70 italic leading-relaxed ${plan.monthlyDetail.options.length > 0 ? "mt-3" : ""}`}>
                          {plan.monthlyDetail.note}
                        </p>
                      </div>
                    </div>
                  )}

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

          {/* Tabla comparativa (solo desktop) */}
          <div className="mt-16 hidden lg:block">
            <h3 className="mb-6 text-center font-display text-xl font-bold text-foreground">
              Comparativa rápida
            </h3>
            <div
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: "hsl(260 15% 18%)", background: "hsl(260 25% 9%)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "hsl(260 15% 18%)" }}>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Qué incluye
                    </th>
                    {STUDIO_PLANS.map((p) => (
                      <th
                        key={p.id}
                        className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-widest ${
                          p.highlighted ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STUDIO_COMPARISON.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={idx % 2 === 0 ? "" : "bg-white/[0.02]"}
                    >
                      <td className="px-6 py-3.5 text-foreground/90">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-6 py-3.5 text-center">
                          {typeof v === "boolean" ? (
                            v ? (
                              <Check className="mx-auto h-4 w-4 text-primary" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                            )
                          ) : (
                            <span className="text-sm text-foreground/80">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* ─── ¿Cómo trabajamos? (timeline) ─── */}
      <section id="como-trabajamos" className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="studio-on-light mb-12 text-center">
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              ¿Cómo trabajamos?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              De la primera llamada a tus pantallas vendiendo, en 4 pasos claros.
            </p>
          </div>

          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STUDIO_STEPS.map((step) => (
              <li
                key={step.n}
                className="relative rounded-2xl border p-6"
                style={{
                  borderColor: "hsl(260 15% 18%)",
                  background: "linear-gradient(180deg, hsl(260 25% 11%) 0%, hsl(260 25% 8%) 100%)",
                }}
              >
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold"
                  style={{
                    background: "hsl(270 100% 50% / 0.15)",
                    border: "1px solid hsl(270 100% 50% / 0.4)",
                    color: "hsl(280 100% 75%)",
                  }}
                >
                  {step.n}
                </div>
                <h3 className="font-display text-base font-bold text-foreground md:text-lg">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── FAQ específica de Studio ─── */}
      <section id="faq-studio" className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="studio-on-light mb-10 text-center">
            <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Preguntas frecuentes sobre Studio
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              Todo lo que los dueños de restaurantes nos preguntan antes de arrancar.
            </p>
          </div>

          <div className="space-y-3">
            {STUDIO_FAQ.map((f) => (
              <details
                key={f.q}
                className="group/faq rounded-xl border transition-colors"
                style={{ borderColor: "hsl(260 15% 20%)", background: "hsl(260 25% 9%)" }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-foreground">
                  {f.q}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-open/faq:rotate-180" />
                </summary>
                <div className="border-t border-border/30 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </div>
              </details>
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

      </div>

      {/* ─── Footer ─── */}
      <LegalFooter />



      <ExpertChat open={chatOpen} onOpenChange={setChatOpen} />
    </PremiumBackground>
  );
};

export default Studio;
