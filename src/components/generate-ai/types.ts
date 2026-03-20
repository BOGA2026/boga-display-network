export interface DecorativeElement {
  tipo: string;
  color: string;
  opacity: number;
  posicion: string;
}

export interface Proposal {
  id: number;
  nombre: string;
  concepto: string;
  background_color: string;
  background_image_query: string;
  overlay_color: string;
  overlay_opacity: number;
  layout: "centrado" | "izquierda" | "derecha";
  texto_principal: string;
  texto_secundario: string;
  texto_cta: string;
  color_texto: string;
  color_acento: string;
  fuente_titulo: string;
  fuente_cuerpo: string;
  titulo_size: number;
  subtitulo_size: number;
  elementos: string[];
  elementos_decorativos: DecorativeElement[];
}

export interface GenerateResponse {
  propuestas: Proposal[];
}

export const CANVAS_SIZES: Record<string, { w: number; h: number }> = {
  "16:9": { w: 960, h: 540 },
  "9:16": { w: 540, h: 960 },
  "1:1": { w: 700, h: 700 },
};

export const TITLE_FONTS = ["Oswald", "Montserrat", "Playfair Display", "Space Grotesk", "Bebas Neue"];
export const BODY_FONTS = ["Inter", "Roboto", "DM Sans", "Source Sans Pro", "Cormorant"];
export const ALL_FONTS = [...TITLE_FONTS, ...BODY_FONTS];

export const SVG_ICONS: Record<string, { path: string; viewBox: string }> = {
  Estrella: {
    path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    viewBox: "0 0 24 24",
  },
  Check: {
    path: "M20 6L9 17l-5-5",
    viewBox: "0 0 24 24",
  },
  Flecha: {
    path: "M5 12h14M12 5l7 7-7 7",
    viewBox: "0 0 24 24",
  },
  Teléfono: {
    path: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
    viewBox: "0 0 24 24",
  },
  Ubicación: {
    path: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
    viewBox: "0 0 24 24",
  },
  Reloj: {
    path: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2",
    viewBox: "0 0 24 24",
  },
};
