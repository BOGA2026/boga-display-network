/**
 * Proration utilities for subscription billing.
 * All amounts in COP. Proration by day.
 */

/** Pricing tiers (same as /precios) */
const TIERS = [
  { max: 5, price: 50000 },
  { max: 20, price: 42000 },
  { max: 50, price: 35000 },
  { max: 100, price: 28000 },
  { max: 300, price: 22000 },
];

export function getUnitPrice(totalScreens: number): number {
  for (const t of TIERS) {
    if (totalScreens <= t.max) return t.price;
  }
  return TIERS[TIERS.length - 1].price;
}

export function getStorage(screens: number): string {
  return `${Math.min(Math.ceil(screens / 10), 20)} GB`;
}

/** Number of days in the current billing cycle */
export function cycleDays(billingAnchor: Date): number {
  const start = new Date(billingAnchor);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/** Next billing date from anchor */
export function nextBillingDate(anchor: Date, today: Date = new Date()): Date {
  const d = new Date(anchor);
  while (d <= today) {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

/** Days remaining until next billing date */
export function daysRemaining(anchor: Date, today: Date = new Date()): number {
  const next = nextBillingDate(anchor, today);
  return Math.max(0, Math.round((next.getTime() - today.getTime()) / 86400000));
}

/** Calculate proration for adding a screen mid-cycle */
export function calculateProration(
  unitPrice: number,
  billingAnchor: Date,
  addDate: Date = new Date()
): { amount: number; daysLeft: number; totalDays: number; dailyRate: number } {
  const next = nextBillingDate(billingAnchor, addDate);
  const cycleStart = new Date(next);
  cycleStart.setMonth(cycleStart.getMonth() - 1);

  const totalDays = Math.round((next.getTime() - cycleStart.getTime()) / 86400000);
  const daysLeft = Math.max(0, Math.round((next.getTime() - addDate.getTime()) / 86400000));
  const dailyRate = unitPrice / totalDays;
  const amount = Math.round((dailyRate * daysLeft) * 100) / 100;

  return { amount, daysLeft, totalDays, dailyRate };
}

/** Calculate credit for removing a screen mid-cycle */
export function calculateCredit(
  unitPrice: number,
  billingAnchor: Date,
  removeDate: Date = new Date()
): number {
  const { amount } = calculateProration(unitPrice, billingAnchor, removeDate);
  return amount;
}

/** Format COP */
export const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

/** Format date es-CO */
export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
