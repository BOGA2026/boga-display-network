/**
 * Tipografías curadas para pantallas vistas a 4 metros.
 *
 * No se permiten fuentes propias: el player solo puede renderizar estas.
 * Si una pantalla recibe una familia que no tiene, el texto sale en un tipo
 * genérico o directamente en blanco, y el cliente no sabe por qué.
 */
export interface BrandFont {
  /** Nombre exacto de la familia (así viaja al player y a la IA). */
  family: string;
  /** Cómo se la describe al dueño del restaurante, sin jerga. */
  descripcion: string;
  grupo: "Sans" | "Serif" | "Condensada";
  /** Pesos que cargamos de Google Fonts. */
  weights: string;
}

export const BRAND_FONTS: BrandFont[] = [
  { family: "Montserrat", descripcion: "Redonda y moderna. Funciona para todo.", grupo: "Sans", weights: "400;600;800" },
  { family: "Poppins", descripcion: "Amable y muy legible de lejos.", grupo: "Sans", weights: "400;600;700" },
  { family: "Inter", descripcion: "Neutra y limpia. Ideal para descripciones.", grupo: "Sans", weights: "400;500;600;700" },
  { family: "Work Sans", descripcion: "Sobria, con buen aire entre letras.", grupo: "Sans", weights: "400;600;700" },
  { family: "Archivo Black", descripcion: "Muy gruesa. Se lee desde el fondo del local.", grupo: "Sans", weights: "400" },
  { family: "Anton", descripcion: "Impacto máximo para precios y promos.", grupo: "Condensada", weights: "400" },
  { family: "Oswald", descripcion: "Angosta: cabe más texto en una línea.", grupo: "Condensada", weights: "400;600;700" },
  { family: "Bebas Neue", descripcion: "Titulares altos para nombres largos.", grupo: "Condensada", weights: "400" },
  { family: "Barlow Condensed", descripcion: "Angosta y suave, buena para listas.", grupo: "Condensada", weights: "400;600;700" },
  { family: "Playfair Display", descripcion: "Elegante, con carácter de carta.", grupo: "Serif", weights: "400;600;700" },
  { family: "Merriweather", descripcion: "Serif robusta, se lee muy bien.", grupo: "Serif", weights: "400;700" },
  { family: "Roboto Slab", descripcion: "Serif de trazo recto, moderna.", grupo: "Serif", weights: "400;600;700" },
];

export const DEFAULT_HEADING_FONT = "Montserrat";
export const DEFAULT_BODY_FONT = "Inter";

const loaded = new Set<string>();

/** Inyecta la familia de Google Fonts una sola vez por sesión. */
export function ensureFont(family?: string | null) {
  if (!family || loaded.has(family)) return;
  const def = BRAND_FONTS.find((f) => f.family === family);
  if (!def) return;
  loaded.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${def.weights}&display=swap`;
  document.head.appendChild(link);
}

/** Carga todas las familias curadas (para la vista previa de la sección). */
export function ensureAllBrandFonts() {
  BRAND_FONTS.forEach((f) => ensureFont(f.family));
}
