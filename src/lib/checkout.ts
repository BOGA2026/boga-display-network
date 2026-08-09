/**
 * checkout.ts — arma el enlace a la pasarela con todo lo que ya sabemos de
 * la visita. La tarjeta de plan no pide nada: el plan, la marca de televisor
 * y la campaña viajan en la URL para que el resumen salga preseleccionado.
 */

import { getAttribution, type PlanChoice } from "@/lib/attribution";

export interface CheckoutParams {
  plan: PlanChoice;
  /** Precio mensual por pantalla del tramo elegido (COP). */
  monthly?: number;
  /** Código de descuento real (oferta de salida). */
  code?: string;
}

export function checkoutHref({ plan, monthly, code }: CheckoutParams): string {
  const a = getAttribution();
  const params = new URLSearchParams({ plan });
  const needsDevice = a.needs_device ?? true;
  params.set("dispositivo", needsDevice ? "si" : "no");
  if (a.tv_brand) params.set("marca", a.tv_brand);
  if (a.utm_campaign) params.set("campana", a.utm_campaign);
  if (monthly) params.set("mensual", String(monthly));
  if (code) params.set("codigo", code);
  return `/checkout?${params.toString()}`;
}
