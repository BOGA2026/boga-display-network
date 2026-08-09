/**
 * Single source of truth for public pricing.
 * All amounts in COP per screen / month. IVA included.
 *
 * NEVER hardcode prices in components — always import from here.
 */

export const PRICING_TIERS = [
  { min: 1, max: 5, pricePerScreen: 50000 },
  { min: 6, max: 20, pricePerScreen: 42000 },
  { min: 21, max: 50, pricePerScreen: 35000 },
  { min: 51, max: 100, pricePerScreen: 28000 },
  { min: 101, max: 300, pricePerScreen: 22000 },
] as const;

export const ENTERPRISE_MIN = 301;

export type PricingTier = (typeof PRICING_TIERS)[number];

/** Tier that a given screen count falls into (undefined if enterprise). */
export function findTier(screens: number): PricingTier | undefined {
  return PRICING_TIERS.find((t) => screens >= t.min && screens <= t.max);
}

/** Cheapest price per screen (the "desde X" figure). */
export const MIN_PRICE_PER_SCREEN =
  PRICING_TIERS[PRICING_TIERS.length - 1].pricePerScreen;

/** Most expensive price per screen (entry tier). */
export const MAX_PRICE_PER_SCREEN = PRICING_TIERS[0].pricePerScreen;

/* ── Plan anual ───────────────────────────────────────────────────────────
 * Precio de lista (mensual × 12), precio real y los dos meses gratis.
 * La landing, la página principal y el panel leen de acá: si cambia el
 * precio, cambia en los tres lugares a la vez.
 */

/** Precio de lista del año: el mensual por doce meses. Se muestra tachado. */
export const ANNUAL_LIST_PRICE_PER_SCREEN = MAX_PRICE_PER_SCREEN * 12;

/**
 * El plan anual tiene DOS formas y sólo se muestra la que aplica:
 * - Con dispositivo: cuesta lo mismo que el mensual y el aparato va incluido.
 * - Sin dispositivo: si el televisor ya sirve, se regalan tres meses.
 */
export const ANNUAL_WITH_DEVICE_PER_SCREEN = 600000;
export const ANNUAL_WITHOUT_DEVICE_PER_SCREEN = 450000;

/** Meses regalados en la variante sin dispositivo. */
export const ANNUAL_FREE_MONTHS = Math.round(
  (ANNUAL_LIST_PRICE_PER_SCREEN - ANNUAL_WITHOUT_DEVICE_PER_SCREEN) / MAX_PRICE_PER_SCREEN,
);

/** Copia y monto de la variante anual que corresponde al visitante. */
export function annualVariant(needsDevice: boolean) {
  return needsDevice
    ? {
        needsDevice: true,
        price: ANNUAL_WITH_DEVICE_PER_SCREEN,
        chip: "Dispositivo incluido",
        blurb: "Pagas lo mismo que el plan mensual y el dispositivo va incluido.",
      }
    : {
        needsDevice: false,
        price: ANNUAL_WITHOUT_DEVICE_PER_SCREEN,
        chip: `${ANNUAL_FREE_MONTHS} meses gratis`,
        blurb: "Si tu televisor ya sirve, te ahorras tres meses.",
      };
}

/**
 * Costo del primer año en cada modalidad, según si hace falta el aparato.
 * Con dispositivo: mensual = 12 meses + dispositivo. Sin dispositivo: 12 meses.
 */
export function firstYearTotals(needsDevice: boolean, devicePriceCop: number) {
  return {
    mensual: ANNUAL_LIST_PRICE_PER_SCREEN + (needsDevice ? devicePriceCop : 0),
    anual: annualVariant(needsDevice).price,
  };
}


/* ── IVA ──────────────────────────────────────────────────────────────────
 * Todos los precios publicados YA incluyen el IVA del 19%. La leyenda vive
 * acá para que la página principal, la landing de campaña, la suscripción,
 * el resumen previo al pago y los correos digan exactamente lo mismo.
 */

/** IVA colombiano vigente. */
export const IVA_RATE = 0.19;

/** Leyenda corta que acompaña a cada precio. */
export const IVA_LEGEND = "IVA incluido";

/** Leyenda larga para notas al pie de las secciones de precios. */
export const PRICING_FOOTNOTE =
  "Precios en pesos colombianos (COP), IVA del 19% incluido. Facturación mensual.";

/**
 * Desglosa un monto con IVA incluido en base gravable + IVA, como lo exige
 * la DIAN en la factura electrónica. Nunca aplicar 19% sobre el total.
 * Ej: 50.000 → { base: 42.017, iva: 7.983 }
 */
export function splitIva(grossCop: number) {
  const base = Math.round(grossCop / (1 + IVA_RATE));
  return { base, iva: grossCop - base, total: grossCop };
}

/** Meses que se pagan al elegir el plan anual (12 menos los gratis). */
export const ANNUAL_BILLED_MONTHS = 12 - ANNUAL_FREE_MONTHS;

/** Precio anual por pantalla para cualquier tramo mensual. */
export function annualPricePerScreen(monthlyPerScreen: number) {
  return monthlyPerScreen * ANNUAL_BILLED_MONTHS;
}


/**
 * Variante anual para CUALQUIER tramo por volumen, con la misma regla que la
 * landing de campaña: con dispositivo se pagan los doce meses y el aparato va
 * incluido; sin dispositivo se regalan los meses de `ANNUAL_FREE_MONTHS`.
 */
export function annualVariantFor(monthlyPerScreen: number, needsDevice: boolean) {
  return needsDevice
    ? {
        needsDevice: true,
        price: monthlyPerScreen * 12,
        chip: "Dispositivo incluido",
        blurb: "Pagas lo mismo que el plan mensual y el dispositivo va incluido.",
      }
    : {
        needsDevice: false,
        price: monthlyPerScreen * ANNUAL_BILLED_MONTHS,
        chip: `${ANNUAL_FREE_MONTHS} meses gratis`,
        blurb: "Si tu televisor ya sirve, te ahorras tres meses.",
      };
}

/** Nota al pie de la vista anual. */
export const ANNUAL_FOOTNOTE =
  "Precios en pesos colombianos (COP), IVA del 19% incluido. Pago anual por adelantado.";

/* ── Prueba gratuita ──────────────────────────────────────────────────────
 * HOY NO EXISTE: el alta no crea ninguna suscripción en estado `trialing`
 * ni hay temporizador que la venza. Mientras siga en false, ninguna
 * superficie puede prometer días gratis.
 */
export const FREE_TRIAL_AVAILABLE = false;
export const FREE_TRIAL_DAYS = 0;

/** Texto del botón principal de alta, único para todas las superficies. */
export const PRIMARY_CTA_LABEL = FREE_TRIAL_AVAILABLE
  ? `Prueba gratis ${FREE_TRIAL_DAYS} días`
  : "Crea tu cuenta";
