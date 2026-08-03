import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import {
  ANNUAL_FREE_MONTHS,
  ANNUAL_LIST_PRICE_PER_SCREEN,
  ANNUAL_PRICE_PER_SCREEN,
  MAX_PRICE_PER_SCREEN,
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
 */
export function PlanPriceCards({ onChange }: Props) {
  const totals = firstYearTotals(VISUALIA_DEVICE_PRICE_COP);

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
            <span className="text-sm text-muted-foreground">por pantalla, al mes</span>
            <span className="text-sm text-muted-foreground">
              Dispositivo: {formatCop(VISUALIA_DEVICE_PRICE_COP)}
            </span>
            <span className="mt-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Sin permanencia
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </Link>

        {/* Anual */}
        <Link to={href("anual")} onClick={() => go("anual")} className={cardClass}>
          <span className="flex min-h-[44px] flex-col items-start justify-center gap-1">
            <span className="text-base font-semibold text-foreground">Anual</span>
            <span className="flex items-baseline gap-2">
              <span className="v-numeric text-sm text-muted-foreground line-through">
                {formatCop(ANNUAL_LIST_PRICE_PER_SCREEN)}
              </span>
              <span className="v-numeric text-2xl font-bold text-foreground">
                {formatCop(ANNUAL_PRICE_PER_SCREEN)}
              </span>
            </span>
            <span className="text-sm text-muted-foreground">por pantalla, al año</span>
            <span className="text-sm font-medium text-foreground">
              Te ahorras {formatCop(VISUALIA_DEVICE_PRICE_COP)} del dispositivo
            </span>
            <span className="mt-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              {ANNUAL_FREE_MONTHS} meses gratis
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </Link>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Primer año con dispositivo:{" "}
        <span className="v-numeric text-foreground">{formatCop(totals.mensual)}</span> mensual ·{" "}
        <span className="v-numeric font-semibold text-foreground">{formatCop(totals.anual)}</span>{" "}
        anual
      </p>
    </div>
  );
}

export default PlanPriceCards;
