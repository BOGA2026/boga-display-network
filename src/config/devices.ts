/**
 * devices.ts — configuración editable del chequeo de televisor y de los
 * dispositivos que recomendamos.
 *
 * Los modelos y los precios cambian seguido: actualizá SOLO este archivo,
 * nunca los componentes. Precios en pesos colombianos, sin decimales.
 *
 * Regla de producto: solo recomendamos aparatos con Google TV, porque traen
 * Play Store y permiten instalar la app de Visualia directamente.
 */

export type DeviceType = "tv_google" | "dispositivo_externo" | "desconocido";

export type BrandVerdict = "probable" | "necesita_dispositivo" | "desconocido";

export interface TvBrand {
  id: string;
  name: string;
  /** Iniciales que se muestran en el selector cuando no hay logo. */
  short: string;
  verdict: BrandVerdict;
}

/** Marcas más vendidas en Colombia, en orden de relevancia. */
export const TV_BRANDS: TvBrand[] = [
  { id: "samsung", name: "Samsung", short: "SAM", verdict: "necesita_dispositivo" },
  { id: "lg", name: "LG", short: "LG", verdict: "necesita_dispositivo" },
  { id: "sony", name: "Sony", short: "SONY", verdict: "probable" },
  { id: "tcl", name: "TCL", short: "TCL", verdict: "probable" },
  { id: "hisense", name: "Hisense", short: "HIS", verdict: "probable" },
  { id: "philips", name: "Philips", short: "PHI", verdict: "probable" },
  { id: "xiaomi", name: "Xiaomi", short: "MI", verdict: "probable" },
  { id: "kalley", name: "Kalley", short: "KAL", verdict: "probable" },
  { id: "otra", name: "Otra marca", short: "···", verdict: "desconocido" },
  { id: "no_se", name: "No sé", short: "?", verdict: "desconocido" },
];

export interface DeviceModel {
  id: string;
  name: string;
  /** Precio de referencia en tiendas, en COP. */
  priceCop: number;
  note?: string;
}

/** Modelos compatibles (todos con Google TV). Actualizá precios acá. */
export const DEVICE_MODELS: DeviceModel[] = [
  { id: "chromecast_hd", name: "Chromecast con Google TV (HD)", priceCop: 189000, note: "El más económico" },
  { id: "chromecast_4k", name: "Chromecast con Google TV (4K)", priceCop: 279000 },
  { id: "google_tv_streamer", name: "Google TV Streamer (4K)", priceCop: 449000, note: "El más rápido" },
  { id: "tcl_google_tv_box", name: "TCL Google TV Box", priceCop: 259000 },
  { id: "xiaomi_tv_box_s", name: "Xiaomi TV Box S (Google TV)", priceCop: 299000 },
];

/** Precio del dispositivo enviado y configurado por Visualia. */
export const VISUALIA_DEVICE_PRICE_COP = 250000;

/** Ciclos de facturación en los que el dispositivo va incluido. */
export const DEVICE_INCLUDED_CYCLES = ["yearly", "anual", "contract_1y"];

export const DEVICE_ORDER_STATUSES = [
  "pendiente",
  "configurando",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export type DeviceOrderStatus = (typeof DEVICE_ORDER_STATUSES)[number];

export const DEVICE_ORDER_STATUS_LABEL: Record<DeviceOrderStatus, string> = {
  pendiente: "Pedido recibido",
  configurando: "Lo estamos configurando",
  enviado: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Formato colombiano: $250.000, sin decimales. */
export function formatCop(value: number): string {
  return `$${Math.round(value).toLocaleString("es-CO")}`;
}

export function deviceIsIncluded(billingCycle?: string | null): boolean {
  if (!billingCycle) return false;
  return DEVICE_INCLUDED_CYCLES.includes(billingCycle.toLowerCase());
}
