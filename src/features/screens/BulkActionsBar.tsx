import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ListMusic, CalendarClock, RefreshCw, MapPin, X, Loader2, Trash2 } from "lucide-react";
import type { LocationRow } from "./types";

interface Props {
  selectedIds: string[];
  locations: LocationRow[];
  /** Solo dueño o administrador ven "Eliminar". */
  canDelete: boolean;
  onDelete: () => void;
  onClear: () => void;
  onDone: () => void;
}

/**
 * Acciones en lote. El caso real de una cadena es "cambiar el menú de las doce
 * sedes de Bogotá": seleccionar el grupo, elegir la lista, confirmar.
 */
export default function BulkActionsBar({ selectedIds, locations, canDelete, onDelete, onClear, onDone }: Props) {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [playlistId, setPlaylistId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const n = selectedIds.length;

  useEffect(() => {
    if (!assignOpen || playlists.length) return;
    supabase
      .from("playlists")
      .select("id, name")
      .order("name")
      .then(({ data }) => setPlaylists(data ?? []));
  }, [assignOpen, playlists.length]);

  const assignPlaylist = async () => {
    if (!playlistId) return;
    setBusy(true);
    await supabase.from("schedules").update({ is_active: false }).in("screen_id", selectedIds);
    const { error } = await supabase.from("schedules").insert(
      selectedIds.map((screen_id) => ({
        screen_id,
        playlist_id: playlistId,
        start_time: new Date().toISOString(),
        is_active: true,
      })),
    );
    setBusy(false);
    if (error) {
      toast({ title: "No se pudo asignar la lista", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Lista asignada a ${n} ${n === 1 ? "pantalla" : "pantallas"}` });
    setAssignOpen(false);
    onDone();
  };

  const moveLocation = async () => {
    if (!locationId) return;
    setBusy(true);
    const { error } = await supabase.from("screens").update({ location_id: locationId }).in("id", selectedIds);
    setBusy(false);
    if (error) {
      toast({ title: "No se pudieron mover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${n} ${n === 1 ? "pantalla movida" : "pantallas movidas"} de sede` });
    setMoveOpen(false);
    onDone();
  };

  const forceSync = async () => {
    setBusy(true);
    const { error } = await supabase.from("screen_commands").insert(
      selectedIds.map((screen_id) => ({ screen_id, command: "SYNC", payload: {}, status: "pending" })),
    );
    setBusy(false);
    if (error) {
      toast({ title: "No se pudo enviar la orden", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Sincronización enviada",
      description: `${n} ${n === 1 ? "pantalla la recibirá" : "pantallas la recibirán"} en menos de 60 segundos.`,
    });
  };

  return (
    <>
      <div className="sticky bottom-4 z-30 mx-auto flex w-fit max-w-full flex-wrap items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-3 py-2 shadow-[0_16px_48px_-16px_rgba(138,0,255,0.45)] backdrop-blur">
        <span className="px-2 text-sm font-semibold">
          {n} {n === 1 ? "seleccionada" : "seleccionadas"}
        </span>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAssignOpen(true)}>
          <ListMusic className="h-4 w-4" /> Asignar lista
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => navigate("/dashboard/programacion")}>
          <CalendarClock className="h-4 w-4" /> Cambiar programación
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={forceSync} disabled={busy}>
          <RefreshCw className="h-4 w-4" /> Forzar sincronización
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setMoveOpen(true)}>
          <MapPin className="h-4 w-4" /> Mover de sede
        </Button>
        {canDelete && (
          <>
            <span className="mx-1 h-5 w-px bg-border/60" />
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          </>
        )}
        <Button size="icon" variant="ghost" aria-label="Quitar selección" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar lista a {n} {n === 1 ? "pantalla" : "pantallas"}</DialogTitle>
            <DialogDescription>Reemplaza la lista activa en todas las pantallas seleccionadas.</DialogDescription>
          </DialogHeader>
          <Select value={playlistId} onValueChange={setPlaylistId}>
            <SelectTrigger><SelectValue placeholder="Elige una lista" /></SelectTrigger>
            <SelectContent>
              {playlists.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={assignPlaylist} disabled={!playlistId || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mover {n} {n === 1 ? "pantalla" : "pantallas"} de sede</DialogTitle>
            <DialogDescription>Elige la sede a la que pertenecerán.</DialogDescription>
          </DialogHeader>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger><SelectValue placeholder="Elige una sede" /></SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMoveOpen(false)}>Cancelar</Button>
            <Button onClick={moveLocation} disabled={!locationId || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
