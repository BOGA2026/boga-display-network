import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { queryClient } from "@/lib/query-client";
import { pageQueryKeys } from "@/lib/routePrefetch";

/** Una pantalla es "en vivo" si reportó en los últimos 3 minutos. */
export function isLiveScreen(lastSeenAt: string | null) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 180_000;
}

/** Basura de prueba: nunca se vinculó, o lleva más de 30 días sin reportar. */
export function isLowRisk(screen: { last_seen_at: string | null }) {
  if (!screen.last_seen_at) return true;
  return Date.now() - new Date(screen.last_seen_at).getTime() > 30 * 24 * 60 * 60 * 1000;
}

function invalidate() {
  queryClient.invalidateQueries({ queryKey: pageQueryKeys.screensPage });
}

type ScreenMutation = "soft_delete_screens" | "restore_screens";

/**
 * Estas mutaciones son sensibles y deben viajar inequívocamente con la sesión.
 * La llamada genérica del cliente llegó como `anon` en producción durante la
 * inicialización de Auth, aunque el usuario ya estuviera dentro del panel.
 */
async function invokeScreenMutation(fn: ScreenMutation, ids: string[]) {
  const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !currentSession?.access_token) {
    return { error: new Error("Tu sesión no está disponible. Inicia sesión nuevamente.") };
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/${fn}`;
  const request = (accessToken: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_ids: ids }),
    });

  let response = await request(currentSession.access_token);

  // La UI puede conservar una sesión local mientras el JWT ya venció. En ese
  // caso renovamos la sesión y repetimos exactamente una vez con el token nuevo.
  if (response.status === 401) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      return { error: new Error("Tu sesión venció. Inicia sesión nuevamente.") };
    }
    response = await request(refreshed.session.access_token);
  }

  if (response.ok) return { error: null };

  const payload = await response.json().catch(() => null) as { message?: string } | null;
  return { error: new Error(payload?.message ?? "No se pudo completar la operación.") };
}

/**
 * Borrado lógico. El historial de reproducción se conserva; el dispositivo
 * físico se entera en su siguiente sincronización y vuelve al código.
 */
export async function deleteScreens(ids: string[]): Promise<boolean> {
  const { error } = await invokeScreenMutation("soft_delete_screens", ids);
  if (error) {
    toast({
      title: "No se pudo eliminar",
      description: error.message,
      variant: "destructive",
    });
    return false;
  }

  invalidate();

  const n = ids.length;
  toast({
    title: n === 1 ? "Pantalla eliminada" : `${n} pantallas eliminadas`,
    description: "El historial de reproducción se conserva.",
    duration: 8000,
    action: (
      <ToastAction altText="Deshacer la eliminación" onClick={() => void restoreScreens(ids)}>
        Deshacer
      </ToastAction>
    ),
  });
  return true;
}

export async function restoreScreens(ids: string[]): Promise<boolean> {
  const { error } = await invokeScreenMutation("restore_screens", ids);
  if (error) {
    toast({ title: "No se pudo restaurar", description: error.message, variant: "destructive" });
    return false;
  }
  invalidate();
  toast({ title: ids.length === 1 ? "Pantalla restaurada" : `${ids.length} pantallas restauradas` });
  return true;
}
