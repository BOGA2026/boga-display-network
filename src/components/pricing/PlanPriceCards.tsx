import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import {
  ANNUAL_LIST_PRICE_PER_SCREEN,
  IVA_LEGEND,
  MAX_PRICE_PER_SCREEN,
  annualVariant,
  firstYearTotals,
} from "@/config/pricing";
import { getAttribution, setPlanChoice, trackConversion, type PlanChoice } from "@/lib/attribution";

interface Props {
  /** Se avisa al padre para que el mensaje de WhatsApp mencione el plan. */
  onChange?: (plan: PlanChoice) => void;
}

/**
 * Dos tarjetas que navegan al alta con el plan elegido. Un clic, una
 * navegación: sin estado intermedio que hiciera parecer que nada pasaba.
 * Los montos vienen de src/config/pricing.ts para no divergir entre la
 * landing de campaña, la página principal y el panel.
 *
 * El plan anual tiene dos formas y sólo se muestra una: la que corresponde a
 * lo que el visitante ya respondió en el verificador de televisor. Sin
 * respuesta se asume el caso más común (necesita dispositivo) y se deja un
 * enlace para ver la otra.
 */
export function PlanPriceCards({ onChange }: Props) {
  const answered = getAttribution().needs_device;
  const [needsDevice, setNeedsDevice] = useState<boolean>(answered ?? true);
  const variant = annualVariant(needsDevice);
  const totals = firstYearTotals(needsDevice, VISUALIA_DEVICE_PRICE_COP);

  const href = (plan: PlanChoice) => {
    const { tv_brand, needs_device } = getAttribution();
    const params = new URLSearchParams({ plan });
    if (tv_brand) {
      params.set("marca", tv_brand);
      params.set("dispositivo", needs_device ? "si" : "no");
    }
    return `/registro?${params.toString()}`;
  };

  const go = (plan: PlanChoice) => {
    setPlanChoice(plan);
    trackConversion("plan_select", { plan });
    onChange?.(plan);
  };

  const cardClass =
    "v-focus-ring group flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-4 text-left transition hover:border-primary/60 hover:bg-card/70";

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Mensual */}
        <Link to={href("mensual")} onClick={() => go("mensual")} className={cardClass}>
          <span className="flex min-h-[44px] flex-col items-start justify-center gap-1">
            <span className="text-base font-semibold text-foreground">Mensual</span>
            <span className="v-numeric text-2xl font-bold text-foreground">
              {formatCop(MAX_PRICE_PER_SCREEN)}
            </span>
            <span className="text-xs text-muted-foreground">{IVA_LEGEND}</span>
            <span className="text-sm text-muted-foreground">por pantalla, al mes</span>
            {needsDevice && (
              <span className="text-sm text-muted-foreground">
                Dispositivo: {formatCop(VISUALIA_DEVICE_PRICE_COP)}
              </span>
            )}
            <span className="mt-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Sin permanencia
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </Link>

        {/* Anual — sólo la variante que aplica */}
        <Link to={href("anual")} onClick={() => go("anual")} className={cardClass}>
          <span className="flex min-h-[44px] flex-col items-start justify-center gap-1">
            <span className="text-base font-semibold text-foreground">Anual</span>
            <span className="flex items-baseline gap-2">
              {!needsDevice && (
                <span className="v-numeric text-sm text-muted-foreground line-through">
                  {formatCop(ANNUAL_LIST_PRICE_PER_SCREEN)}
                </span>
              )}
              <span className="v-numeric text-2xl font-bold text-foreground">
                {formatCop(variant.price)}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">{IVA_LEGEND}</span>
            <span className="text-sm text-muted-foreground">por pantalla, al año</span>
            <span className="text-sm font-medium text-foreground">{variant.blurb}</span>
            <span className="mt-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              {variant.chip}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </Link>
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
    </div>
  );
}

export default PlanPriceCards;
