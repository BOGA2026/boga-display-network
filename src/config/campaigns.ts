/**
 * campaigns.ts — variantes de la landing de tráfico pagado (/lp/:campana).
 *
 * Cada campaña define SOLO lo que cambia: titular, subtítulo, video del hero y
 * el mensaje prellenado de WhatsApp. Todo lo demás de la página es igual.
 *
 * Para lanzar una campaña nueva no se escribe código: se agrega una entrada acá
 * y la ruta /lp/<clave> queda viva. Si la clave no existe, se usa "default".
 */
import { COMPAT_CLIPS, type ClipConfig } from "@/config/compatibilityMedia";

export interface Campaign {
  /** Clave de la ruta: /lp/<slug> */
  slug: string;
  /** Debe coincidir con la promesa del anuncio. */
  headline: string;
  /** Una sola frase con la promesa concreta. */
  subheadline: string;
  /** Video del hero, en bucle y silenciado. */
  hero: ClipConfig;
  /** Mensaje prellenado de WhatsApp (se le agrega la campaña). */
  whatsappMessage: string;
}

const CAMPAIGNS: Record<string, Campaign> = {
  default: {
    slug: "default",
    headline: "Tu menú en la pantalla del restaurante, y lo cambias desde el celular",
    subheadline:
      "Cambia precios y platos en segundos, sin reimprimir nada.",
    hero: COMPAT_CLIPS.paso3,
    whatsappMessage: "Hola, vi su anuncio y quiero saber cómo funciona la pantalla de menú",
  },
  almuerzo: {
    slug: "almuerzo",
    headline: "Muestra el almuerzo del día en la pantalla y véndelo más",
    subheadline:
      "Cambias el menú del día en segundos y lo ve todo el que entra.",
    hero: COMPAT_CLIPS.paso3,
    whatsappMessage: "Hola, vi su anuncio del menú del día y quiero información",
  },
  precios: {
    slug: "precios",
    headline: "Cambias un precio y ya está en la pantalla",
    subheadline:
      "Sin reimprimir carteles, sin esperar al diseñador, sin costos extra.",
    hero: COMPAT_CLIPS.dispositivo,
    whatsappMessage: "Hola, vi su anuncio y quiero cambiar mis precios desde el celular",
  },
};

export const DEFAULT_CAMPAIGN = CAMPAIGNS.default;

export function getCampaign(slug?: string): Campaign {
  if (!slug) return DEFAULT_CAMPAIGN;
  return CAMPAIGNS[slug.toLowerCase()] ?? DEFAULT_CAMPAIGN;
}
