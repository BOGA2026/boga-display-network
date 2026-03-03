import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ListMusic, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Playlist {
  id: string;
  name: string;
  itemCount: number;
}

interface AssignPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenId: string;
  screenName: string;
  onAssigned?: () => void;
}

export default function AssignPlaylistDialog({
  open,
  onOpenChange,
  screenId,
  screenName,
  onAssigned,
}: AssignPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open, screenId]);

  const loadData = async () => {
    setLoading(true);
    const [playlistsRes, scheduleRes] = await Promise.all([
      supabase
        .from("playlists")
        .select("id, name, playlist_items(id)")
        .order("name"),
      supabase
        .from("schedules")
        .select("playlist_id")
        .eq("screen_id", screenId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

    const mapped: Playlist[] = (playlistsRes.data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      itemCount: p.playlist_items?.length ?? 0,
    }));

    setPlaylists(mapped);
    const current = scheduleRes.data?.playlist_id ?? null;
    setCurrentPlaylistId(current);
    setSelectedId(current);
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);

    // Deactivate existing schedules for this screen
    await supabase
      .from("schedules")
      .update({ is_active: false })
      .eq("screen_id", screenId);

    // Create new active schedule
    const { error } = await supabase.from("schedules").insert({
      screen_id: screenId,
      playlist_id: selectedId,
      start_time: new Date().toISOString(),
      is_active: true,
    });

    setSaving(false);

    if (error) {
      toast({
        title: "Error al asignar playlist",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const playlistName = playlists.find((p) => p.id === selectedId)?.name;
    toast({
      title: "Playlist asignada",
      description: `"${playlistName}" se asignó a "${screenName}".`,
    });

    onOpenChange(false);
    onAssigned?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Asignar contenido
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Selecciona una playlist para reproducir en{" "}
            <strong className="text-foreground">{screenName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ListMusic className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              Sin playlists disponibles
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea una playlist desde el panel de contenido primero.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {playlists.map((pl) => {
                const isSelected = selectedId === pl.id;
                const isCurrent = currentPlaylistId === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => setSelectedId(pl.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/30 bg-card/40 hover:bg-secondary/30"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <ListMusic className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{pl.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pl.itemCount} {pl.itemCount === 1 ? "elemento" : "elementos"}
                        {isCurrent && (
                          <span className="ml-2 text-primary">• Actual</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                disabled={!selectedId || saving}
                onClick={handleAssign}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Asignando...
                  </span>
                ) : (
                  "Asignar playlist"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
