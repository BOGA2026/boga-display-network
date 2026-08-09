import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Check, X } from "lucide-react";
import { VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import {
  ANNUAL_LIST_PRICE_PER_SCREEN,
  IVA_LEGEND,
  MAX_PRICE_PER_SCREEN,
  annualVariant,
  firstYearTotals,
} from "@/config/pricing";
import { getAttribution, setPlanChoice, trackConversion, type PlanChoice } from "@/lib/attribution";
import { checkoutHref } from "@/lib/checkout";
import { ExitOfferModal } from "@/components/pricing/ExitOfferModal";

interface Props {
  /** Se avisa al padre para que el mensaje de WhatsApp mencione el plan. */
  onChange?: (plan: PlanChoice) => void;
}

/**
 * Dos tarjetas que llevan directo al checkout con el plan elegido: la
 * tarjeta entera es clickeable, sin pasos intermedios. Los montos vienen de
 * src/config/pricing.ts para no divergir entre la landing de campaña, la
 * página principal y el panel.
 */
export function PlanPriceCards({ onChange }: Props) {
  const navigate = useNavigate();
  const answered = getAttribution().needs_device;
  const [needsDevice, setNeedsDevice] = useState<boolean>(answered ?? true);
  const variant = annualVariant(needsDevice);
  const totals = firstYearTotals(needsDevice, VISUALIA_DEVICE_PRICE_COP);

  const annualSavings = ANNUAL_LIST_PRICE_PER_SCREEN - variant.price;
  const annualPercent = Math.round((annualSavings / ANNUAL_LIST_PRICE_PER_SCREEN) * 100);

  const go = (plan: PlanChoice) => {
    setPlanChoice(plan);
    trackConversion("plan_select", { plan });
    onChange?.(plan);
    navigate(checkoutHref({ plan, monthly: MAX_PRICE_PER_SCREEN }));
  };

  const cardBase =
    "v-focus-ring group relative flex cursor-pointer flex-col rounded-2xl border p-5 text-left transition-all duration-300";

  const clickProps = (plan: PlanChoice) => ({
    role: "link" as const,
    tabIndex: 0,
    onClick: () => go(plan),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go(plan);
      }
    },
  });

  const Feature = ({ on, children }: { on: boolean; children: React.ReactNode }) => (
    <li className="flex items-start gap-2 text-sm">
      {on ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
      )}
      <span className={on ? "text-foreground" : "text-muted-foreground/70"}>{children}</span>
    </li>
  );

  return (
    <div id="planes">
      <div className="grid items-stretch gap-4 sm:grid-cols-2">
        {/* Mensual */}
        <div
          {...clickProps("mensual")}
          className={`${cardBase} border-border/70 bg-card/50 hover:-translate-y-1 hover:border-border hover:shadow-[0_16px_40px_-20px_hsl(var(--foreground)/0.35)]`}
        >
          <span className="text-base font-semibold text-foreground">Mensual</span>
          <span className="v-numeric mt-2 text-3xl font-bold text-foreground">
            {formatCop(MAX_PRICE_PER_SCREEN)}
          </span>
          <span className="text-sm text-muted-foreground">por pantalla, al mes</span>
          <span className="text-xs text-muted-foreground">{IVA_LEGEND}</span>

          <ul className="mt-4 space-y-2">
            <Feature on>Sin permanencia</Feature>
            <Feature on={false}>Dos meses gratis</Feature>
            <Feature on={!needsDevice}>
              {needsDevice
                ? `Dispositivo aparte: ${formatCop(VISUALIA_DEVICE_PRICE_COP)}`
                : "No necesitas dispositivo"}
            </Feature>
          </ul>

          <span className="mt-auto flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-border pt-0 text-sm font-semibold text-foreground transition group-hover:bg-muted/40">
            Elegir mensual
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>

        {/* Anual — la recomendada */}
        <div
          {...clickProps("anual")}
          className={`${cardBase} border-primary/70 bg-card/80 shadow-[0_0_40px_hsl(var(--accent-glow)/0.25)] hover:-translate-y-1 hover:shadow-[0_0_64px_hsl(var(--accent-glow)/0.45)]`}
        >
          <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            Más elegido
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-foreground">Anual</span>
            {annualPercent > 0 && (
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {annualPercent}% menos
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="v-numeric text-3xl font-bold text-foreground">
              {formatCop(variant.price)}
            </span>
            {annualSavings > 0 && (
              <span className="v-numeric text-sm text-muted-foreground line-through">
                {formatCop(ANNUAL_LIST_PRICE_PER_SCREEN)}
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">por pantalla, al año</span>
          <span className="text-xs text-muted-foreground">{IVA_LEGEND}</span>
          <span className="mt-2 inline-flex w-fit rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
            {variant.chip}
          </span>

          <ul className="mt-4 space-y-2">
            <Feature on>Sin permanencia</Feature>
            <Feature on={!needsDevice}>Dos meses gratis</Feature>
            <Feature on={needsDevice}>Dispositivo incluido</Feature>
          </ul>

          <div className="mt-auto">
            <span className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition group-hover:shadow-[0_0_40px_hsl(var(--accent-glow)/0.55)]">
              Elegir anual
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
            {annualSavings > 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Ahorras{" "}
                <span className="v-numeric font-semibold text-foreground">
                  {formatCop(annualSavings)}
                </span>{" "}
                frente al mensual
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Primer año {needsDevice ? "con dispositivo" : "sin dispositivo"}:{" "}
        <span className="v-numeric text-foreground">{formatCop(totals.mensual)}</span> mensual ·{" "}
        <span className="v-numeric font-semibold text-foreground">{formatCop(totals.anual)}</span>{" "}
        anual
      </p>
      <p className="text-xs text-muted-foreground">{IVA_LEGEND}</p>

      <button
        type="button"
        onClick={() => setNeedsDevice((v) => !v)}
        className="mt-2 text-sm text-primary underline underline-offset-4"
      >
        {needsDevice
          ? "¿Tu televisor ya sirve? Ver precio sin dispositivo"
          : "¿Necesitas el dispositivo? Ver precio con dispositivo"}
      </button>

      <ExitOfferModal sectionId="planes" />
    </div>
  );
}

export default PlanPriceCards;
