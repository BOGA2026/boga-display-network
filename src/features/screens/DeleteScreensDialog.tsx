import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LastSyncLabel } from "@/components/system/LastSyncLabel";
import { findTier, MAX_PRICE_PER_SCREEN } from "@/config/pricing";
import { deleteScreens, isLiveScreen, isLowRisk } from "./deleteScreens";
import type { ScreenRow } from "./types";

interface Props {
  screens: ScreenRow[];
  locationName: (id: string) => string;
  /** Pantallas activas hoy, para anticipar el efecto en el plan. */
  totalScreens: number;
  subscription?: { screens_count?: number; price_per_screen?: number | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

/**
 * La fricción depende del riesgo: una pantalla de prueba se va con un clic,
 * una pantalla en vivo muestra qué va a pasar de verdad en el local.
 */
export default function DeleteScreensDialog({
  screens,
  locationName,
  totalScreens,
  subscription,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [playlist, setPlaylist] = useState<string | null>(null);

  const single = screens.length === 1 ? screens[0] : null;
  const live = single ? isLiveScreen(single.last_seen_at) : screens.some((s) => isLiveScreen(s.last_seen_at));
  const lowRisk = !!single && isLowRisk(single);
  const neverPaired = !!single && !single.last_seen_at && !single.device_token;

  // Lista asignada: solo hace falta cuando la pantalla está viva.
  useEffect(() => {
    if (!open || !single || lowRisk) {
      setPlaylist(null);
      return;
    }
    let alive = true;
    supabase
      .from("schedules")
      .select("playlists(name)")
      .eq("screen_id", single.id)
      .eq("is_active", true)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setPlaylist((data as { playlists?: { name?: string } } | null)?.playlists?.name ?? null);
      });
    return () => {
      alive = false;
    };
  }, [open, single, lowRisk]);

  const remaining = Math.max(0, totalScreens - screens.length);
  const licensed = subscription?.screens_count ?? totalScreens;
  const perScreen =
    subscription?.price_per_screen ?? findTier(Math.max(1, remaining))?.pricePerScreen ?? MAX_PRICE_PER_SCREEN;
  const planChanges = remaining < licensed;

  const confirm = async () => {
    setBusy(true);
    const ok = await deleteScreens(screens.map((s) => s.id));
    setBusy(false);
    if (ok) {
      onOpenChange(false);
      onDeleted();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {single
              ? `¿Eliminar ${single.name}?`
              : `¿Eliminar ${screens.length} pantallas?`}
          </DialogTitle>
          <DialogDescription>
            {single && neverPaired
              ? "Esta pantalla nunca se vinculó a un dispositivo."
              : single && lowRisk
                ? "Esta pantalla no reporta hace más de 30 días."
                : "El dispositivo dejará de reproducir contenido y volverá a la pantalla de vinculación. El historial de reproducción se conserva."}
          </DialogDescription>
        </DialogHeader>

        {/* Contexto real de la pantalla en vivo */}
        {single && !lowRisk && (
          <div className="space-y-1.5 rounded-lg border border-border/30 bg-card/40 p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={cn("v-dot", live ? "v-dot-live" : "v-dot-offline")} />
              <span className="font-medium">{single.name}</span>
            </div>
            <p className="text-muted-foreground">Sede: {locationName(single.location_id)}</p>
            <p className="text-muted-foreground">
              Última conexión: <LastSyncLabel lastSeenAt={single.last_seen_at} />
            </p>
            <p className="text-muted-foreground">Lista asignada: {playlist ?? "ninguna"}</p>
          </div>
        )}

        {/* Selección múltiple: nombres, no un conteo abstracto */}
        {!single && (
          <div className="space-y-1 rounded-lg border border-border/30 bg-card/40 p-3 text-sm">
            <p className="mb-1.5 text-muted-foreground">
              Vas a eliminar {screens.length} pantallas:
            </p>
            <ul className="space-y-1">
              {screens.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className={cn("v-dot", isLiveScreen(s.last_seen_at) ? "v-dot-live" : "v-dot-offline")} />
                  <span className="truncate">{s.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {locationName(s.location_id)}
                  </span>
                </li>
              ))}
            </ul>
            {live && (
              <p className="pt-1.5 text-xs text-muted-foreground">
                Las que están en vivo dejarán de reproducir y volverán a la pantalla de vinculación.
              </p>
            )}
          </div>
        )}

        {planChanges && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Tu plan quedará en {remaining} {remaining === 1 ? "pantalla" : "pantallas"}. El próximo cobro será
            de {cop(perScreen * remaining)}. El ciclo actual no se prorratea.
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {single && lowRisk ? "Eliminar" : "Eliminar pantalla" + (single ? "" : "s")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
