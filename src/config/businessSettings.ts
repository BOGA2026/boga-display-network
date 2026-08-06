/**
 * Ajustes del negocio — constantes compartidas.
 *
 * El cupo de almacenamiento es del plan, no del número de pantallas: el
 * consumo real se calcula sumando `content.file_size_bytes` en la base
 * (RPC `business_usage`), nunca con una fórmula derivada.
 */

/** Cupo de almacenamiento incluido en el plan. */
export const STORAGE_LIMIT_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB

/** A partir de acá la barra se pone en ámbar. */
export const STORAGE_WARN_RATIO = 0.8;

export const BUSINESS_CATEGORIES = [
  { value: "restaurante", label: "Restaurante" },
  { value: "cafeteria", label: "Cafetería" },
  { value: "comidas_rapidas", label: "Comidas rápidas" },
  { value: "panaderia", label: "Panadería" },
  { value: "bar", label: "Bar" },
  { value: "otro", label: "Otro" },
] as const;

/** Zonas horarias de Colombia y vecinas frecuentes. */
export const TIMEZONE_OPTIONS = [
  { value: "America/Bogota", label: "América/Bogotá (COT, UTC−5)" },
  { value: "America/Lima", label: "América/Lima (UTC−5)" },
  { value: "America/Mexico_City", label: "América/Ciudad de México (UTC−6)" },
  { value: "America/Panama", label: "América/Panamá (UTC−5)" },
  { value: "America/Caracas", label: "América/Caracas (UTC−4)" },
  { value: "America/Santiago", label: "América/Santiago (UTC−4)" },
  { value: "America/New_York", label: "América/Nueva York (UTC−5/−4)" },
  { value: "America/Los_Angeles", label: "América/Los Ángeles (UTC−8/−7)" },
  { value: "Europe/Madrid", label: "Europa/Madrid (UTC+1/+2)" },
] as const;

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 60] as const;

export const EXPIRY_OPTIONS = [
  { value: "nunca", label: "Nunca vence", days: null as number | null },
  { value: "7", label: "7 días", days: 7 },
  { value: "30", label: "30 días", days: 30 },
  { value: "90", label: "90 días", days: 90 },
] as const;

/** Formato colombiano: coma decimal, "1,89 GB". */
export function formatGB(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb < 0.01 && bytes > 0) return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  return `${gb.toFixed(2).replace(".", ",")} GB`;
}

export type ExpiryState = "vencido" | "porVencer" | "vigente" | null;

/** Estado de vigencia de una pieza: vencida, por vencer (<7 días) o vigente. */
export function expiryState(expiresAt?: string | null): ExpiryState {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "vencido";
  if (ms <= 7 * 24 * 60 * 60 * 1000) return "porVencer";
  return "vigente";
}

/** Etiqueta corta para el chip: "Vencido" o "Vence en 3 días". */
export function expiryLabel(expiresAt?: string | null): string | null {
  const state = expiryState(expiresAt);
  if (!state || !expiresAt) return null;
  if (state === "vencido") return "Vencido";
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (state === "porVencer") return days <= 1 ? "Vence hoy" : `Vence en ${days} días`;
  return `Vence el ${new Date(expiresAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}`;
}

/** Fecha de vencimiento para una pieza nueva según el ajuste del negocio. */
export function expiresAtFromDefault(days?: number | null): string | null {
  if (!days || days <= 0) return null;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
