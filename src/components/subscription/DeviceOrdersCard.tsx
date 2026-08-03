/**
 * DeviceOrdersCard — el dispositivo incluido es un argumento concreto del pago
 * anual, y además el cliente debe poder ver dónde está su aparato sin
 * escribirle a soporte.
 */
import { PackageCheck } from "lucide-react";
import { COPY } from "@/config/lexicon";
import {
  DEVICE_ORDER_STATUS_LABEL,
  deviceIsIncluded,
  formatCop,
} from "@/config/devices";
import { useDeviceOrders, PriceComparison } from "@/features/devices";
import { ANNUAL_FREE_MONTHS, firstYearTotals } from "@/config/pricing";
import { VISUALIA_DEVICE_PRICE_COP } from "@/config/devices";

const FIRST_YEAR = firstYearTotals(VISUALIA_DEVICE_PRICE_COP);

interface Props {
  billingCycle?: string | null;
}

export function DeviceOrdersCard({ billingCycle }: Props) {
  const { orders, loading } = useDeviceOrders();
  const included = deviceIsIncluded(billingCycle);
  const C = COPY.dispositivo;

  return (
    <div className="v-card space-y-4 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <PackageCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">{C.pedidosTitulo}</h3>
          <p className="text-sm text-muted-foreground">
            {included ? C.incluidoNota : C.anualArgumento}
          </p>
        </div>
      </div>

      {!included && (
        <>
          <PriceComparison />
          <p className="text-xs text-muted-foreground">
            Primer año con dispositivo:{" "}
            <span className="v-numeric">{formatCop(FIRST_YEAR.mensual)}</span> mensual ·{" "}
            <span className="v-numeric font-semibold text-foreground">
              {formatCop(FIRST_YEAR.anual)}
            </span>{" "}
            anual ({ANNUAL_FREE_MONTHS} meses gratis).
          </p>
        </>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{C.pedidosVacio}</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-border/40 px-3 py-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  {o.model_name ?? "Dispositivo Visualia"}
                </span>
                <span className="v-numeric text-sm text-muted-foreground">
                  {o.included || o.price_cop === 0 ? C.sinCosto : formatCop(o.price_cop)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  {DEVICE_ORDER_STATUS_LABEL[o.status] ?? o.status}
                </span>
                <span>
                  {o.city}
                  {o.tracking_code ? ` · Guía ${o.tracking_code}` : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
