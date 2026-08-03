import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import { MAX_PRICE_PER_SCREEN } from "@/config/pricing";
import { getAttribution, setPlanChoice, trackConversion, type PlanChoice } from "@/lib/attribution";

interface Props {
  /** Se avisa al padre para que el mensaje de WhatsApp mencione el plan. */
  onChange?: (plan: PlanChoice) => void;
}

/** El anual es el mensual por doce meses, sin descuento adicional. */
const ANNUAL_PRICE_COP = MAX_PRICE_PER_SCREEN * 12;

const OPTIONS: {
  id: PlanChoice;
  title: string;
  price: string;
  device: string;
  tag: string;
  highlight: boolean;
}[] = [
  {
    id: "mensual",
    title: "Mensual",
    price: `${formatCop(MAX_PRICE_PER_SCREEN)} por pantalla al mes`,
    device: `Dispositivo: ${formatCop(VISUALIA_DEVICE_PRICE_COP)}`,
    tag: "Sin permanencia",
    highlight: false,
  },
  {
    id: "anual",
    title: "Anual",
    price: `${formatCop(ANNUAL_PRICE_COP)} por pantalla al año`,
    device: "Dispositivo incluido",
    tag: `Ahorras ${formatCop(VISUALIA_DEVICE_PRICE_COP)}`,
    highlight: true,
  },
];

/**
 * Dos tarjetas que navegan al alta con el plan elegido. Un clic, una
 * navegación: sin estado intermedio que hiciera parecer que nada pasaba.
 */
export default function PlanSelector({ onChange }: Props) {
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

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((o) => (
        <Link
          key={o.id}
          to={href(o.id)}
          onClick={() => go(o.id)}
          className="v-focus-ring group flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-4 text-left transition hover:border-primary/60 hover:bg-card/70"
        >
          <span className="flex min-h-[44px] flex-col items-start justify-center gap-1">
            <span className="text-base font-semibold text-foreground">{o.title}</span>
            <span className="text-sm text-foreground/90">{o.price}</span>
            <span className="text-sm text-muted-foreground">{o.device}</span>
            <span
              className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                o.highlight
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {o.tag}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </Link>
      ))}
    </div>
  );
}
