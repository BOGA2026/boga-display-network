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

/** Precio real del pago anual adelantado, por pantalla. */
export const ANNUAL_PRICE_PER_SCREEN = 500000;

/** Meses regalados frente al mensual (redondeado hacia abajo). */
export const ANNUAL_FREE_MONTHS = Math.round(
  (ANNUAL_LIST_PRICE_PER_SCREEN - ANNUAL_PRICE_PER_SCREEN) / MAX_PRICE_PER_SCREEN,
);

/** Costo real del primer año con dispositivo, en cada modalidad. */
export function firstYearTotals(devicePriceCop: number) {
  return {
    mensual: ANNUAL_LIST_PRICE_PER_SCREEN + devicePriceCop,
    anual: ANNUAL_PRICE_PER_SCREEN,
  };
}
