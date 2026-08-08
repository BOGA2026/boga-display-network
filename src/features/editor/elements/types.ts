import type { ElementColors } from "./svg";

export type CategoryId =
  | "sugeridos"
  | "comida"
  | "etiquetas"
  | "dieta"
  | "precios"
  | "divisores"
  | "servicio"
  | "temporadas"
  | "formas"
  | "fondos";

export type ElementKind = "icon" | "graphic" | "badge" | "diet" | "background";

export interface ElementDef {
  id: string;
  label: string;
  /** Etiquetas en español (incluye sinónimos regionales) para el buscador. */
  tags: string[];
  category: CategoryId;
  kind: ElementKind;
  /** Tamaño de inserción en el lienzo (px sobre 1920×1080). */
  size: [number, number];
  /** Markup SVG con tokens __C__ (acento), __P__ (primario), __S__ (secundario). */
  svg: (c: ElementColors) => string;
  /** Texto editable que se inserta como capa de texto encima (insignias). */
  text?: string;
  /** Estilo de la capa de texto que acompaña a la insignia. */
  textColor?: "light" | "dark";
  textSize?: number;
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  sugeridos: "Sugeridos para ti",
  comida: "Comida y bebida",
  etiquetas: "Etiquetas y distintivos",
  dieta: "Dieta y alérgenos",
  precios: "Precios y números",
  divisores: "Divisores y marcos",
  servicio: "Servicio y logística",
  temporadas: "Temporadas",
  formas: "Formas",
  fondos: "Fondos",
};
