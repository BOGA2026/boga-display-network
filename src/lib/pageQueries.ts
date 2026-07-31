/**
 * Consultas principales de cada sección del dashboard.
 *
 * Viven acá (y no dentro de la página) para que el hover del menú pueda
 * adelantar exactamente la misma consulta, con exactamente la misma queryKey,
 * que usa la vista al montar. Si la clave no coincide al carácter, react-query
 * no reutiliza la caché y el prefetch no sirve de nada.
 *
 * Cada sección resuelve TODO en una sola RPC (security invoker: la RLS sigue
 * aplicando con el usuario real), en vez de encadenar perfil + N consultas.
 */
import { supabase } from "@/integrations/supabase/client";

/** staleTime compartido entre el prefetch y el hook de la página. */
export const PAGE_STALE_TIME = 30 * 1000;

export type ScreensPageData = {
  screens: any[];
  locations: any[];
  subscription: any | null;
};

export type ContentPageData = {
  content: any[];
  playlists: any[];
};

/** /dashboard/pantallas — pantallas + sedes + suscripción en un solo viaje. */
export async function fetchScreensPage(): Promise<ScreensPageData> {
  const { data, error } = await supabase.rpc("get_screens_page");
  if (error) throw error;
  const payload = (data ?? {}) as any;
  return {
    screens: payload.screens ?? [],
    locations: payload.locations ?? [],
    subscription: payload.subscription ?? null,
  };
}

/** /dashboard/contenido — archivos + resumen de listas en un solo viaje. */
export async function fetchContentPage(): Promise<ContentPageData> {
  const { data, error } = await supabase.rpc("get_content_page");
  if (error) throw error;
  const payload = (data ?? {}) as any;
  return {
    content: payload.content ?? [],
    playlists: payload.playlists ?? [],
  };
}

/** Compatibilidad: solo la lista de archivos. */
export async function fetchContentList(): Promise<any[]> {
  return (await fetchContentPage()).content;
}

/** /dashboard/listas — playlists del negocio. */
export async function fetchPlaylists(): Promise<any[]> {
  return (await fetchContentPage()).playlists;
}
