import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/query-client";
import { pageQueryKeys } from "@/lib/routePrefetch";

/** Una pantalla es "en vivo" si reportó en los últimos 3 minutos. */
export function isLiveScreen(lastSeenAt: string | null) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 180_000;
}

/** Basura de prueba: nunca se vinculó, o lleva más de 30 días sin reportar. */
export function isLowRisk(screen: { last_seen_at: string | null; device_token: string | null }) {
  if (!screen.last_seen_at) return true;
  return Date.now() - new Date(screen.last_seen_at).getTime() > 30 * 24 * 60 * 60 * 1000;
}

function invalidate() {
  queryClient.invalidateQueries({ queryKey: pageQueryKeys.screensPage });
  queryClient.invalidateQueries({ queryKey: pageQueryKeys.dashboardPage });
}

/**
 * Borrado lógico. El historial de reproducción se conserva; el dispositivo
 * físico se entera en su siguiente sincronización y vuelve al código.
 */
export async function deleteScreens(ids: string[]): Promise<boolean> {
  const { error } = await supabase.rpc("soft_delete_screens", { p_ids: ids });
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
    action: {
      label: "Deshacer",
      onClick: () => restoreScreens(ids),
    } as never,
  });
  return true;
}

export async function restoreScreens(ids: string[]): Promise<boolean> {
  const { error } = await supabase.rpc("restore_screens", { p_ids: ids });
  if (error) {
    toast({ title: "No se pudo restaurar", description: error.message, variant: "destructive" });
    return false;
  }
  invalidate();
  toast({ title: ids.length === 1 ? "Pantalla restaurada" : `${ids.length} pantallas restauradas` });
  return true;
}
