/**
 * "Tu plan" — la razón para pagar por adelantado son los dos meses gratis, que
 * le sirven a todo el mundo. El dispositivo incluido es un beneficio extra que
 * solo se le muestra a quien lo necesita, y que puede pedir que no se le
 * vuelva a ofrecer.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { COPY } from "@/config/lexicon";
import {
  DEVICE_ORDER_STATUS_LABEL,
  deviceIsIncluded,
  formatCop,
  VISUALIA_DEVICE_PRICE_COP,
} from "@/config/devices";
import { useDeviceOrders } from "@/features/devices";
import {
  ANNUAL_FREE_MONTHS,
  ANNUAL_LIST_PRICE_PER_SCREEN,
  annualVariant,
} from "@/config/pricing";
import { SUPPORT_WHATSAPP_NUMBER } from "@/config/support";



const SWITCH_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola, quiero cambiarme a pago anual adelantado.",
)}`;

interface Props {
  billingCycle?: string | null;
  businessId?: string | null;
  /** Pantallas del negocio, para calcular el ahorro real y si hace falta aparato. */
  screens?: { device_type?: string | null }[];
}

export function DeviceOrdersCard({ billingCycle, businessId, screens = [] }: Props) {
  const { orders, loading } = useDeviceOrders();
  const included = deviceIsIncluded(billingCycle);
  const C = COPY.dispositivo;

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    let alive = true;
    supabase
      .from("businesses")
      .select("device_offer_dismissed")
      .eq("id", businessId)
      .maybeSingle()
      .then(({ data }) => {
        if (alive && data?.device_offer_dismissed) setDismissed(true);
      });
    return () => {
      alive = false;
    };
  }, [businessId]);

  const dismissDevice = async () => {
    setDismissed(true);
    if (businessId) {
      await supabase.from("businesses").update({ device_offer_dismissed: true }).eq("id", businessId);
    }
  };

  // Le hace falta un aparato si alguna pantalla no es un televisor con Google TV,
  // o si nunca respondió el verificador de compatibilidad.
  const neverAnswered = screens.length === 0 || screens.every((s) => !s.device_type || s.device_type === "desconocido");
  const anyNeedsDevice = screens.some((s) => s.device_type && s.device_type !== "tv_google");
  const showDevice = !dismissed && (anyNeedsDevice || neverAnswered);

  const screenCount = Math.max(screens.length, 1);
  const annual = annualVariant(showDevice);
  const annualSaving = (ANNUAL_LIST_PRICE_PER_SCREEN - annual.price) * screenCount;

  return (
    <div className="v-card space-y-4 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">{C.pedidosTitulo}</h3>
          <p className="text-sm text-muted-foreground">{annual.blurb}</p>
        </div>
      </div>

      {/* Beneficio 1 — para todos */}
      <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
        <p className="text-sm font-semibold text-primary">
          Pago anual: {annual.chip}
        </p>
        <p className="mt-1 text-sm text-foreground">
          {!annual.needsDevice && (
            <>
              <span className="v-numeric text-muted-foreground line-through">
                {formatCop(ANNUAL_LIST_PRICE_PER_SCREEN)}
              </span>{" "}
            </>
          )}
          <span className="v-numeric text-lg font-semibold">{formatCop(annual.price)}</span>{" "}
          <span className="text-muted-foreground">al año por pantalla</span>
        </p>
        <p className="text-xs text-muted-foreground">{IVA_LEGEND}</p>
      </div>


      {/* Beneficio 2 — solo si le sirve */}
      {showDevice && (
        <div className="space-y-2 rounded-xl border border-border/50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground">
              <PackageCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Además, el dispositivo va incluido</p>
              <p className="text-sm text-muted-foreground">
                Te ahorras {formatCop(VISUALIA_DEVICE_PRICE_COP)}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissDevice}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            No necesito dispositivo
          </button>
        </div>
      )}

      {/* Si ya está en mensual, el ahorro concreto */}
      {!included && (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            Con {screens.length || 1} {screens.length === 1 ? "pantalla" : "pantallas"}, cambiar a pago
            anual te ahorra <span className="v-numeric font-semibold">{formatCop(annualSaving)}</span> al
            año.
          </p>
          <Button asChild className="w-full">
            <a href={SWITCH_URL} target="_blank" rel="noopener noreferrer">
              Cambiar a pago anual
            </a>
          </Button>
        </div>
      )}

      {/* Estado del pedido del aparato */}
      {showDevice && (
        loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{C.pedidosVacio}</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/pantallas">Pedir dispositivo</Link>
            </Button>
          </div>
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
        )
      )}
    </div>
  );
}
