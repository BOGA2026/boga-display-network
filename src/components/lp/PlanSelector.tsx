import { useRef } from "react";
import { Check } from "lucide-react";
import { VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import { MAX_PRICE_PER_SCREEN } from "@/config/pricing";
import { setPlanChoice, trackConversion, type PlanChoice } from "@/lib/attribution";

interface Props {
  value: PlanChoice;
  onChange: (plan: PlanChoice) => void;
}

/** El anual es el mensual por doce meses. Si algún día lleva descuento, se
 *  cambia acá y el ahorro mostrado se recalcula solo. */
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
    price: `${formatCop(MAX_PRICE_PER_SCREEN)} por pantalla, al mes`,
    device: `Dispositivo: ${formatCop(VISUALIA_DEVICE_PRICE_COP)}`,
    tag: "Sin permanencia",
    highlight: false,
  },
  {
    id: "anual",
    title: "Anual",
    price: `${formatCop(ANNUAL_PRICE_COP)} por pantalla, al año`,
    device: "Dispositivo: incluido",
    tag: `Ahorras ${formatCop(VISUALIA_DEVICE_PRICE_COP)}`,
    highlight: true,
  },
];

/**
 * Selector real de plan. Antes eran dos filas de texto con pinta de opción
 * marcada: la persona hacía clic y no pasaba nada. Ahora es un radiogroup
 * navegable con Tab y flechas, y la elección viaja con el lead.
 */
export default function PlanSelector({ value, onChange }: Props) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (plan: PlanChoice) => {
    onChange(plan);
    setPlanChoice(plan);
    trackConversion("plan_select", { plan });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const next: PlanChoice = value === "mensual" ? "anual" : "mensual";
    select(next);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Elige tu plan" className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((o) => {
        const checked = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            ref={(el) => {
              refs.current[o.id] = el;
            }}
            onClick={() => select(o.id)}
            onKeyDown={onKeyDown}
            className={`flex min-h-[56px] cursor-pointer flex-col items-start gap-1 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              checked
                ? "border-primary bg-primary/10"
                : "border-border/60 bg-card/40 hover:border-primary/50 hover:bg-card/60"
            }`}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-base font-semibold text-foreground">{o.title}</span>
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {checked && <Check className="h-3 w-3" />}
              </span>
            </span>
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
          </button>
        );
      })}
    </div>
  );
}
