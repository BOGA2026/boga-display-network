import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Seo from "@/components/Seo";
import PremiumBackground from "@/components/layout/PremiumBackground";
import { VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import {
  EXIT_OFFER,
  IVA_LEGEND,
  MAX_PRICE_PER_SCREEN,
  PRICING_FOOTNOTE,
  annualVariantFor,
  discountPercentFor,
  splitIva,
} from "@/config/pricing";
import { captureTvChoiceFromUrl, trackConversion } from "@/lib/attribution";

/**
 * Resumen previo al pago. Llega con el plan ya elegido desde las tarjetas:
 * acá sólo se confirma. Los montos salen de src/config/pricing.ts y el
 * descuento se valida contra el código real, nunca contra la URL.
 */
export default function Checkout() {
  const [params] = useSearchParams();
  useMemo(() => captureTvChoiceFromUrl(), []);

  const plan = params.get("plan") === "mensual" ? "mensual" : "anual";
  const needsDevice = params.get("dispositivo") !== "no";
  const monthly = Number(params.get("mensual")) || MAX_PRICE_PER_SCREEN;
  const code = params.get("codigo");
  const percent = discountPercentFor(code);

  const annual = annualVariantFor(monthly, needsDevice);
  const base = plan === "anual" ? annual.price : monthly;
  const total = percent ? Math.round((base * (100 - percent)) / 100 / 1000) * 1000 : base;
  const iva = splitIva(total);

  const registerHref = `/registro?${new URLSearchParams({
    plan,
    dispositivo: needsDevice ? "si" : "no",
    ...(code && percent ? { codigo: code } : {}),
  }).toString()}`;

  return (
    <div className="relative min-h-screen">
      <Seo
        title="Confirmar plan | Visualia"
        description="Revisa tu plan y confirma para empezar."
        path="/checkout"
        noindex
      />
      <PremiumBackground>
      <main className="relative z-10 mx-auto max-w-lg px-4 py-14">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Confirma tu plan
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ya está todo elegido. Revisa y continúa al pago.
        </p>

        <div className="v-card mt-6 p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-base font-semibold text-foreground">
              Plan {plan === "anual" ? "anual" : "mensual"}
            </span>
            <span className="v-numeric text-2xl font-bold text-foreground">
              {formatCop(total)}
            </span>
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">
            por pantalla / {plan === "anual" ? "año" : "mes"} · {IVA_LEGEND}
          </p>

          {plan === "anual" && (
            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {annual.blurb}
            </p>
          )}
          {needsDevice && (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {plan === "anual"
                ? "Dispositivo incluido"
                : `Dispositivo: ${formatCop(VISUALIA_DEVICE_PRICE_COP)} por única vez`}
            </p>
          )}

          {percent > 0 && (
            <p className="mt-4 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-foreground">
              Código <span className="font-semibold">{code?.toUpperCase()}</span> aplicado:{" "}
              {percent}% adicional ({formatCop(base - total)} menos).
            </p>
          )}
          {code && percent === 0 && (
            <p className="mt-4 text-sm text-destructive">
              El código {code} no es válido o ya venció.
            </p>
          )}

          <div className="mt-5 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Base gravable</span>
              <span className="v-numeric">{formatCop(iva.base)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA 19%</span>
              <span className="v-numeric">{formatCop(iva.iva)}</span>
            </div>
            <div className="mt-2 flex justify-between font-semibold text-foreground">
              <span>Total</span>
              <span className="v-numeric">{formatCop(iva.total)}</span>
            </div>
          </div>

          <Link
            to={registerHref}
            onClick={() =>
              trackConversion("checkout_continue", {
                plan,
                code: percent ? EXIT_OFFER.code : null,
              })
            }
            className="v-focus-ring mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:shadow-[0_0_40px_hsl(var(--accent-glow)/0.55)]"
          >
            Confirmar y pagar
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Pago seguro · Sin permanencia
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">{PRICING_FOOTNOTE}</p>
      </main>
      </PremiumBackground>
    </div>
  );
}
