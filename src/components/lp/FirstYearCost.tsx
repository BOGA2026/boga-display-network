import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatCop } from "@/config/devices";
import {
  DEVICE_PRICE_COP,
  IVA_LEGEND,
  PRICING_TIERS,
  PRICING_FOOTNOTE,
  ahorroPrimerAno,
  costoPrimerAno,
} from "@/config/pricing";

/**
 * El costo del primer año en una sola frase, no en cinco números sueltos.
 * Todos los montos salen de src/config/pricing.ts: acá no se escribe ni se
 * recalcula ningún precio a mano.
 */
export default function FirstYearCost({
  onDeviceChange,
}: {
  onDeviceChange?: (needsDevice: boolean) => void;
}) {
  const [screens, setScreens] = useState(1);
  const [needsDevice, setNeedsDevice] = useState(true);

  const mensual = costoPrimerAno(screens, "mensual", needsDevice);
  const anual = costoPrimerAno(screens, "anual", needsDevice);
  const ahorro = ahorroPrimerAno(screens, needsDevice);

  const setDevice = (v: boolean) => {
    setNeedsDevice(v);
    onDeviceChange?.(v);
  };

  const pantallaLabel = screens === 1 ? "una pantalla" : `${screens} pantallas`;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Mes a mes */}
        <div className="rounded-2xl border border-border/70 bg-card/50 p-5">
          <p className="text-sm font-semibold text-foreground">Mes a mes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCop(mensual.mensualPorPantalla)} por pantalla al mes
            {needsDevice ? ` + ${formatCop(DEVICE_PRICE_COP)} del dispositivo` : ""}.
          </p>
          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Primer año</p>
          <p className="v-numeric font-display text-3xl font-bold text-foreground md:text-4xl">
            {formatCop(mensual.total)}
          </p>
          <p className="text-xs font-medium text-muted-foreground">{IVA_LEGEND}</p>
        </div>

        {/* Anual */}
        <div className="rounded-2xl border border-primary/70 bg-card/80 p-5 shadow-[0_0_40px_hsl(var(--accent-glow)/0.25)]">
          <p className="text-sm font-semibold text-foreground">
            Pago anual{" "}
            {needsDevice && (
              <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Dispositivo incluido
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {needsDevice
              ? "Pagas el año por adelantado y el dispositivo va incluido."
              : "Tu televisor ya sirve: pagas el año y te ahorras tres meses."}
          </p>
          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Primer año</p>
          <p className="v-numeric font-display text-3xl font-bold text-foreground md:text-4xl">
            {formatCop(anual.total)}
          </p>
          <p className="text-xs font-medium text-muted-foreground">{IVA_LEGEND}</p>
        </div>
      </div>

      {ahorro > 0 && (
        <p className="mt-4 text-lg font-semibold text-primary md:text-xl">
          Ahorras {formatCop(ahorro)} con {pantallaLabel} el primer año.
        </p>
      )}

      {/* Ajustes que recalculan el ejemplo, sin competir con el número grande */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Pantallas</span>
          <input
            type="number"
            min={1}
            max={300}
            value={screens}
            onChange={(e) => setScreens(Math.min(300, Math.max(1, Number(e.target.value) || 1)))}
            className="h-10 w-20 rounded-lg border border-border/70 bg-background px-3 text-base text-foreground"
          />
        </label>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>¿Necesitas dispositivo?</span>
          <div className="flex overflow-hidden rounded-lg border border-border/70">
            {[
              { v: true, l: "Sí" },
              { v: false, l: "No" },
            ].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                aria-pressed={needsDevice === v}
                onClick={() => setDevice(v)}
                className={`h-10 px-4 text-sm transition ${
                  needsDevice === v ? "bg-primary/15 text-foreground" : "text-muted-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-5 rounded-xl border border-border/60 bg-card/30 px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground">
          Ver la escala por cantidad de pantallas
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </summary>
        <ul className="mt-3 space-y-1.5 p-0 text-sm text-muted-foreground">
          {PRICING_TIERS.map((t) => (
            <li key={t.min} className="flex list-none justify-between gap-4">
              <span>
                {t.min} a {t.max} pantallas
              </span>
              <span className="text-foreground">
                {formatCop(t.pricePerScreen)} por pantalla al mes
              </span>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-3 text-xs text-muted-foreground">{PRICING_FOOTNOTE}</p>
    </div>
  );
}
