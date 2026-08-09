import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Check, X } from "lucide-react";
import {
  PRICING_TIERS,
  MIN_PRICE_PER_SCREEN,
  IVA_LEGEND,
  PRICING_FOOTNOTE,
  ANNUAL_FOOTNOTE,
  ANNUAL_FREE_MONTHS,
  PRIMARY_CTA_LABEL,
  PLAN_FEATURES,
  PLAN_FEATURE_MATRIX,
  annualVariantFor,
} from "@/config/pricing";
import { getAttribution, setPlanChoice, trackConversion } from "@/lib/attribution";
import { checkoutHref } from "@/lib/checkout";
import { ExitOfferModal } from "@/components/pricing/ExitOfferModal";

const _fmt = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const formatCOP = (n: number) => _fmt.format(n);

type Cycle = "mensual" | "anual";

const tiers = [
  {
    name: `${PRICING_TIERS[0].min} a ${PRICING_TIERS[0].max} pantallas`,
    monthly: PRICING_TIERS[0].pricePerScreen,
    highlight: false,
    cta: "Empezar",
  },
  {
    name: `${PRICING_TIERS[1].min} a ${PRICING_TIERS[1].max} pantallas`,
    monthly: PRICING_TIERS[1].pricePerScreen,
    highlight: true,
    cta: PRIMARY_CTA_LABEL,
  },
  {
    name: `${PRICING_TIERS[2].min} o más`,
    monthly: MIN_PRICE_PER_SCREEN,
    highlight: false,
    cta: "Empezar",
    from: true,
  },
];

/**
 * Precios públicos. Los montos y la leyenda de IVA salen de
 * src/config/pricing.ts para que no diverjan con la landing de campaña,
 * la suscripción, el resumen de pago y los correos.
 *
 * Cada tarjeta entera es un enlace al checkout con el plan ya elegido:
 * un clic, sin pasos intermedios.
 */
export default function PricingSection() {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<Cycle>("mensual");
  const anual = cycle === "anual";

  // Misma regla que /lp: la variante anual depende de si el visitante ya dijo
  // en el verificador que necesita dispositivo. Sin respuesta se asume que sí.
  const answered = getAttribution().needs_device;
  const [needsDevice, setNeedsDevice] = useState<boolean>(answered ?? true);

  const variantOf = (monthly: number) => annualVariantFor(monthly, needsDevice);
  const priceOf = (monthly: number) => (anual ? variantOf(monthly).price : monthly);
  const listOf = (monthly: number) =>
    anual ? monthly * 12 : PRICING_TIERS[0].pricePerScreen;
  const savingsOf = (monthly: number) =>
    anual
      ? monthly * 12 - variantOf(monthly).price
      : (PRICING_TIERS[0].pricePerScreen - monthly) * 12;

  const unitLabel = anual ? "por pantalla / año" : "por pantalla / mes";

  const go = (monthly: number) => {
    setPlanChoice(cycle);
    trackConversion("plan_select", { plan: cycle, monthly });
    navigate(checkoutHref({ plan: cycle, monthly }));
  };

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
        <div className="mb-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Forma de pago"
            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/60 p-1"
          >
            {(["mensual", "anual"] as Cycle[]).map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cycle === c}
                onClick={() => setCycle(c)}
                className={`v-focus-ring rounded-full px-4 py-2 text-sm font-medium transition ${
                  cycle === c
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "mensual" ? "Mensual" : "Anual"}
                {c === "anual" && (
                  <span
                    className={`ml-2 text-xs font-semibold ${
                      cycle === c ? "text-primary-foreground/80" : "text-primary"
                    }`}
                  >
                    −{ANNUAL_FREE_MONTHS} meses
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {tiers.map((t, i) => {
            const price = priceOf(t.monthly);
            const list = listOf(t.monthly);
            const savings = savingsOf(t.monthly);
            const percent = list > price ? Math.round(((list - price) / list) * 100) : 0;
            const included = PLAN_FEATURE_MATRIX[i] ?? [];

            return (
              <div
                key={t.name}
                role="link"
                tabIndex={0}
                onClick={() => go(t.monthly)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go(t.monthly);
                  }
                }}
                className={`v-focus-ring group relative flex cursor-pointer flex-col rounded-2xl border p-7 transition-all duration-300 ${
                  t.highlight
                    ? "border-primary/70 bg-card/80 shadow-[0_0_40px_hsl(var(--accent-glow)/0.25)] hover:-translate-y-1 hover:shadow-[0_0_64px_hsl(var(--accent-glow)/0.45)]"
                    : "border-border/70 bg-card/50 hover:-translate-y-1 hover:border-border hover:shadow-[0_16px_40px_-20px_hsl(var(--foreground)/0.35)]"
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Más elegido
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {t.name}
                  </h3>
                  {percent > 0 && (
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {percent}% menos
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {t.from && (
                      <span className="text-sm text-muted-foreground">desde</span>
                    )}
                    <span className="v-numeric font-display text-4xl font-bold text-foreground">
                      {formatCOP(price)}
                    </span>
                    {percent > 0 && (
                      <span className="v-numeric text-sm text-muted-foreground line-through">
                        {formatCOP(list)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {unitLabel}
                    {t.from && ", según volumen"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{IVA_LEGEND}</p>
                  {anual && (
                    <span className="mt-3 inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                      {variantOf(t.monthly).chip}
                    </span>
                  )}
                </div>

                <ul className="mt-6 space-y-2.5 text-sm">
                  {PLAN_FEATURES.map((f) => {
                    const on = included.includes(f);
                    return (
                      <li key={f} className="flex items-start gap-2">
                        {on ? (
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
                        )}
                        <span
                          className={on ? "text-foreground" : "text-muted-foreground/70"}
                        >
                          {f}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-auto pt-7">
                  <span
                    className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-300 ${
                      t.highlight
                        ? "bg-primary text-primary-foreground group-hover:shadow-[0_0_40px_hsl(var(--accent-glow)/0.55)]"
                        : "border border-border bg-transparent text-foreground group-hover:bg-muted/40"
                    }`}
                  >
                    {t.cta}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  {savings > 0 && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Ahorras{" "}
                      <span className="v-numeric font-semibold text-foreground">
                        {formatCOP(savings)}
                      </span>{" "}
                      frente al {anual ? "mensual" : "plan de entrada, al año"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {anual && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {variantOf(PRICING_TIERS[0].pricePerScreen).blurb}{" "}
            <button
              type="button"
              onClick={() => setNeedsDevice((v) => !v)}
              className="font-medium text-primary underline underline-offset-4"
            >
              {needsDevice ? "Mi televisor ya sirve" : "Necesito el dispositivo"}
            </button>
          </p>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {anual ? ANNUAL_FOOTNOTE : PRICING_FOOTNOTE}
        </p>
      </div>

      <ExitOfferModal sectionId="precios" />
    </section>
  );
}
