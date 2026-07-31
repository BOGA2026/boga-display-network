/**
 * Consultas principales de cada sección del dashboard.
 *
 * Viven acá (y no dentro de la página) para que el hover del menú pueda
 * adelantar exactamente la misma consulta, con exactamente la misma queryKey,
 * que usa la vista al montar. Si la clave no coincide al carácter, react-query
 * no reutiliza la caché y el prefetch no sirve de nada.
 */
import { supabase } from "@/integrations/supabase/client";

/** staleTime compartido entre el prefetch y el hook de la página. */
export const PAGE_STALE_TIME = 30 * 1000;

export type ScreensPageData = {
  screens: any[];
  locations: any[];
  subscription: any | null;
};

async function currentBusinessId(): Promise<string | null> {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.user?.id ?? "")
    .maybeSingle();
  if (error) throw error;
  return data?.business_id ?? null;
}

/** /dashboard/pantallas — pantallas + sedes + suscripción. */
export async function fetchScreensPage(): Promise<ScreensPageData> {
  const businessId = await currentBusinessId();
  if (!businessId) return { screens: [], locations: [], subscription: null };

  const [screensRes, locationsRes, subRes] = await Promise.all([
    supabase
      .from("screens")
      .select("id, name, status, location_id, device_token, last_seen_at, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("locations").select("id, name").eq("business_id", businessId),
    supabase
      .from("subscriptions")
      .select("screens_count, plan, status, expires_at, grace_period_ends_at")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);
  if (screensRes.error) throw screensRes.error;

  return {
    screens: screensRes.data ?? [],
    locations: locationsRes.data ?? [],
    subscription: subRes.data ?? null,
  };
}

/** /dashboard/contenido — archivos del negocio. */
export async function fetchContentList(): Promise<any[]> {
  const { data, error } = await supabase
    .from("content")
    .select("id, name, type, file_url, thumbnail_url, duration_seconds, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** /dashboard/listas — playlists del negocio. */
export async function fetchPlaylists(): Promise<any[]> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .single();
  if (!profile?.business_id) return [];
  const { data, error } = await supabase
    .from("playlists")
    .select("id, name, created_at")
    .eq("business_id", profile.business_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
