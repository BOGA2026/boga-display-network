import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import {
  PRICING_TIERS,
  MIN_PRICE_PER_SCREEN,
  IVA_LEGEND,
  PRICING_FOOTNOTE,
  ANNUAL_FREE_MONTHS,
  annualPricePerScreen,
} from "@/config/pricing";

const _fmt = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const formatCOP = (n: number) => _fmt.format(n);

type Cycle = "mensual" | "anual";

type PricingCard = {
  name: string;
  /** Precio mensual por pantalla. null = a medida. */
  price: number | null;
  features: string[];
  cta: string;
  ctaHref?: string;
  highlight: boolean;
};

const tiers: PricingCard[] = [
  {
    name: `${PRICING_TIERS[0].min} a ${PRICING_TIERS[0].max} pantallas`,
    price: PRICING_TIERS[0].pricePerScreen,
    features: [
      "Actualizaciones ilimitadas",
      "Editor y plantillas listas",
      "Soporte por chat",
    ],
    cta: "Empezar",
    highlight: false,
  },
  {
    name: `${PRICING_TIERS[1].min} a ${PRICING_TIERS[1].max} pantallas`,
    price: PRICING_TIERS[1].pricePerScreen,
    features: [
      "Todo lo anterior",
      "Multi-sede en un solo panel",
      "Programación por horario",
      "Soporte prioritario",
    ],
    cta: "Prueba gratis 14 días",
    highlight: true,
  },
  {
    name: `${PRICING_TIERS[2].min} o más`,
    price: null,
    features: [
      "Descuentos por volumen",
      "Onboarding personalizado",
      "Gerente de cuenta",
    ],
    cta: "Ver calculadora",
    ctaHref: "/precios",
    highlight: false,
  },
];

/**
 * Precios públicos. Los montos y la leyenda de IVA salen de
 * src/config/pricing.ts para que no diverjan con la landing de campaña,
 * la suscripción, el resumen de pago y los correos.
 */
export default function PricingSection() {
  const [cycle, setCycle] = useState<Cycle>("mensual");
  const anual = cycle === "anual";

  const priceOf = (monthly: number) =>
    anual ? annualPricePerScreen(monthly) : monthly;

  const unitLabel = anual ? "por pantalla / año" : "por pantalla / mes";

  return (
    <section id="precios" className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24">
      <div className="section-glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
            Precios
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Un precio simple por pantalla
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sin permanencia. Sin costos ocultos. {IVA_LEGEND}. Cancela cuando quieras.
          </p>
        </div>

        {/* Conmutador mensual / anual */}
        <div className="mb-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Forma de pago"
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
          >
            {(["mensual", "anual"] as Cycle[]).map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cycle === c}
                onClick={() => setCycle(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF] ${
                  cycle === c
                    ? "bg-[#5227FF] text-white"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {c === "mensual" ? "Mensual" : "Anual"}
                {c === "anual" && (
                  <span className="ml-2 text-xs font-semibold text-[#B19EEF]">
                    −{ANNUAL_FREE_MONTHS} meses
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              className={`relative flex flex-col p-7 ${
                t.highlight
                  ? "gradient-border-shine reveal-on-scroll"
                  : "bento-card reveal-on-scroll"
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-[#5227FF] px-3 py-1 text-xs font-semibold text-white">
                  Más popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold text-white">{t.name}</h3>
              <div className="mt-4">
                {t.price !== null ? (
                  <>
                    {anual && (
                      <p className="text-sm text-white/40 line-through">
                        {formatCOP(t.price * 12)}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold text-white">
                        {formatCOP(priceOf(t.price))}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="font-display text-2xl font-semibold text-white">
                    desde {formatCOP(priceOf(MIN_PRICE_PER_SCREEN))}
                  </span>
                )}
                <p className="mt-1 text-sm text-white/60">
                  {unitLabel}
                  {t.price === null && ", según volumen"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{IVA_LEGEND}</p>
                {anual && (
                  <span className="mt-3 inline-flex rounded-full bg-[#5227FF]/20 px-3 py-1 text-xs font-semibold text-[#B19EEF]">
                    {ANNUAL_FREE_MONTHS} meses gratis
                  </span>
                )}
              </div>

              <ul className="mt-6 space-y-2.5 text-sm text-white/90">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B19EEF]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-7">
                <Link
                  to={t.ctaHref ?? `/registro?plan=${cycle}`}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF] ${
                    t.highlight
                      ? "bg-[#5227FF] text-white hover:shadow-[0_0_40px_rgba(82,39,255,0.55)]"
                      : "border border-white/15 bg-transparent text-white hover:bg-white/5"
                  }`}
                >
                  {t.cta}
                  {t.highlight && <ArrowRight className="h-4 w-4" />}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {anual
            ? "Precios en pesos colombianos (COP), IVA del 19% incluido. Pago anual por adelantado."
            : PRICING_FOOTNOTE}
        </p>
      </div>
    </section>
  );
}
