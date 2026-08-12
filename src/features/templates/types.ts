/**
 * Plantillas de Visualia.
 *
 * El equipo de Visualia sube un fondo ya diseñado y marca encima qué partes
 * puede cambiar el cliente. El cliente nunca toca la plantilla original: al
 * elegirla se copia al editor como una pieza nueva.
 *
 * Regla dura: todas las coordenadas van en fracciones de 0 a 1. Un valor en
 * píxeles amarra la plantilla a una resolución y se rompe en el primer
 * televisor distinto.
 */

export type TemplateOrientation = "horizontal" | "vertical";

/** Qué es cada capa para el cliente (define el control que ve en el panel). */
export type TemplateLayerKind = "texto" | "precio" | "foto" | "logo";

/** Qué se espera que suba el cliente en una capa de imagen. */
export type ImageExpectation = "foto" | "recorte";

export interface TemplateTextSpec {
  value: string;
  fontFamily: string;
  /** Alto de la tipografía como fracción del alto del lienzo (0 a 1). */
  size: number;
  weight: number;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
  /** Tope de caracteres sugerido; el catálogo lo usa para avisar. */
  maxChars?: number;
  /** Si está, el color se reemplaza por el de la marca del cliente. */
  brandColor?: "primary" | "secondary" | "accent" | "text";
}

export interface TemplateImageSpec {
  url?: string;
  fit: "cover" | "contain";
  /**
   * "foto": una foto rectangular que se recorta al marco.
   * "recorte": producto sin fondo (PNG); se muestra completo, nunca recortado.
   */
  expects: ImageExpectation;
  radius?: number;
}

export interface TemplateLayer {
  id: string;
  kind: TemplateLayerKind;
  /** Cómo se llama para el cliente: "Nombre del plato", "Precio". */
  label: string;
  editable: boolean;
  /** Todo en fracciones del lienzo. */
  x: number;
  y: number;
  w: number;
  h: number;
  text?: TemplateTextSpec;
  image?: TemplateImageSpec;
}

export interface TemplateDocument {
  version: 1;
  canvas: {
    /** ancho / alto. 16/9 = 1.777…, 9/16 = 0.5625 */
    ratio: number;
    /** Margen de seguridad, fracción del lado corto. */
    safeArea: number;
  };
  layers: TemplateLayer[];
}

export interface TemplateRow {
  id: string;
  name: string;
  business_type: string;
  piece_type: string;
  orientation: string;
  background_url: string;
  thumbnail_url: string;
  document: TemplateDocument;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

/** Texto por debajo de esto no se lee a cuatro metros. */
export const MIN_TEXT_SIZE = 0.028;
/** Margen de seguridad estándar (overscan de televisores). */
export const DEFAULT_SAFE_AREA = 0.05;

export const BUSINESS_TYPES: { value: string; label: string }[] = [
  { value: "restaurante", label: "Restaurante" },
  { value: "cafeteria", label: "Cafetería" },
  { value: "bar", label: "Bar" },
  { value: "panaderia", label: "Panadería" },
  { value: "comida_rapida", label: "Comida rápida" },
  { value: "retail", label: "Tienda" },
  { value: "general", label: "Cualquier negocio" },
];

export const PIECE_TYPES: { value: string; label: string }[] = [
  { value: "menu", label: "Menú" },
  { value: "promocion", label: "Promoción" },
  { value: "combo", label: "Combo" },
  { value: "producto", label: "Producto" },
  { value: "anuncio", label: "Anuncio" },
];

export const ORIENTATIONS: { value: TemplateOrientation; label: string }[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
];

export function labelOf(list: { value: string; label: string }[], value: string) {
  return list.find((i) => i.value === value)?.label ?? value;
}

export function canvasFor(orientation: string) {
  return orientation === "vertical" ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 };
}
