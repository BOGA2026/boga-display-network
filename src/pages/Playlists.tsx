import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ListVideo,
  Plus,
  LayoutGrid,
  GripVertical,
  Clock,
  Repeat,
  Save,
  ArrowLeft,
  Trash2,
  Image,
  Film,
  FileText,
} from "lucide-react";

interface PlaylistItem {
  id: string;
  content_id: string;
  sort_order: number;
  content?: {
    id: string;
    name: string;
    type: string;
    duration_seconds: number | null;
    thumbnail_url: string | null;
  };
}

const Playlists = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [newPlaylist, setNewPlaylist] = useState({ name: "", description: "" });
  const [loopEnabled, setLoopEnabled] = useState(true);

  // Fetch playlists
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .single();
      if (!profile?.business_id) return [];
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch playlist items for editor
  const { data: playlistItems = [] } = useQuery({
    queryKey: ["playlist-items", editingPlaylistId],
    enabled: !!editingPlaylistId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlist_items")
        .select("*, content:content_id(id, name, type, duration_seconds, thumbnail_url)")
        .eq("playlist_id", editingPlaylistId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as PlaylistItem[];
    },
  });

  // Fetch available content for adding to playlist
  const { data: availableContent = [] } = useQuery({
    queryKey: ["available-content"],
    enabled: !!editingPlaylistId,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .single();
      if (!profile?.business_id) return [];
      const { data, error } = await supabase
        .from("content")
        .select("id, name, type, duration_seconds, thumbnail_url")
        .eq("business_id", profile.business_id);
      if (error) throw error;
      return data || [];
    },
  });

  // Create playlist
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .single();
      if (!profile?.business_id) throw new Error("No business");
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          name: payload.name,
          business_id: profile.business_id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setShowCreateModal(false);
      setNewPlaylist({ name: "", description: "" });
      setEditingPlaylistId(data.id);
      toast({ title: "Playlist creada", description: "Ahora puedes agregar contenido." });
    },
    onError: () => toast({ title: "Error", description: "No se pudo crear la playlist.", variant: "destructive" }),
  });

  // Add item to playlist
  const addItemMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const nextOrder = playlistItems.length;
      const { error } = await supabase.from("playlist_items").insert({
        playlist_id: editingPlaylistId!,
        content_id: contentId,
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlist-items", editingPlaylistId] }),
    onError: () => toast({ title: "Error", description: "No se pudo agregar el item.", variant: "destructive" }),
  });

  // Remove item
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("playlist_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlist-items", editingPlaylistId] }),
  });

  // Move item
  const moveItem = async (index: number, direction: "up" | "down") => {
    const items = [...playlistItems];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[index];
    const b = items[swapIdx];
    await Promise.all([
      supabase.from("playlist_items").update({ sort_order: swapIdx }).eq("id", a.id),
      supabase.from("playlist_items").update({ sort_order: index }).eq("id", b.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ["playlist-items", editingPlaylistId] });
  };

  const getContentIcon = (type: string) => {
    if (type === "video") return <Film className="h-4 w-4" />;
    if (type === "html") return <FileText className="h-4 w-4" />;
    return <Image className="h-4 w-4" />;
  };

  const editingPlaylist = playlists.find((p) => p.id === editingPlaylistId);

  // ── EDITOR VIEW ──
  if (editingPlaylistId && editingPlaylist) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingPlaylistId(null)}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{editingPlaylist.name}</h1>
            <p className="text-sm text-muted-foreground">
              {playlistItems.length} elementos · Editor de playlist
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loop</span>
              <Switch checked={loopEnabled} onCheckedChange={setLoopEnabled} />
            </div>
            <Button className="gradient-primary glow-primary-sm text-primary-foreground font-semibold px-5">
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-display text-lg font-semibold">Orden de reproducción</h2>
            {playlistItems.length === 0 ? (
              <Card className="surface-elevated border-dashed border-border/60">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <LayoutGrid className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Agrega contenido desde el panel lateral para construir tu playlist.
                  </p>
                </CardContent>
              </Card>
            ) : (
              playlistItems.map((item, idx) => (
                <Card
                  key={item.id}
                  className="surface-elevated group hover:border-primary/30 transition-all duration-200"
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex flex-col gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, "up")}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        ▲
                      </button>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <button
                        disabled={idx === playlistItems.length - 1}
                        onClick={() => moveItem(idx, "down")}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        ▼
                      </button>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                      {idx + 1}
                    </span>
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      {item.content?.thumbnail_url ? (
                        <img
                          src={item.content.thumbnail_url}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        getContentIcon(item.content?.type || "image")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.content?.name || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.content?.type}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm font-mono">
                        {item.content?.duration_seconds || 10}s
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      onClick={() => removeItemMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add content panel */}
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Contenido disponible</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {availableContent.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay contenido disponible. Sube contenido primero.
                </p>
              ) : (
                availableContent.map((c) => (
                  <Card
                    key={c.id}
                    className="surface-elevated cursor-pointer hover:border-primary/40 transition-all duration-200"
                    onClick={() => addItemMutation.mutate(c.id)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center shrink-0">
                        {getContentIcon(c.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EMPTY STATE ──
  if (!isLoading && playlists.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Playlists</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Organiza tu contenido en playlists.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center text-center max-w-md space-y-6">
            {/* Illustration */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-20 gradient-primary" />
              <div className="relative h-28 w-28 rounded-2xl surface-elevated flex items-center justify-center border border-border/60">
                <ListVideo className="h-14 w-14 text-primary animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold">Crear playlists</h2>
              <p className="text-muted-foreground leading-relaxed">
                Organiza tu contenido, define el orden y la duración de cada elemento para tus
                pantallas.
              </p>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="gradient-primary glow-primary text-primary-foreground font-semibold text-base px-8 py-6 rounded-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar playlist
            </Button>
          </div>
        </div>

        {/* Create Modal */}
        <CreatePlaylistModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          newPlaylist={newPlaylist}
          setNewPlaylist={setNewPlaylist}
          onSubmit={() => createMutation.mutate({ name: newPlaylist.name })}
          isLoading={createMutation.isPending}
        />
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Playlists</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {playlists.length} playlist{playlists.length !== 1 ? "s" : ""} creadas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gradient-primary glow-primary-sm text-primary-foreground font-semibold px-6 py-5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar playlist
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((pl) => (
          <Card
            key={pl.id}
            className="surface-elevated cursor-pointer group hover:border-primary/30 hover:glow-primary-sm transition-all duration-300"
            onClick={() => setEditingPlaylistId(pl.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <ListVideo className="h-5 w-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-base truncate">{pl.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Creada {new Date(pl.created_at).toLocaleDateString("es-MX")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreatePlaylistModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        newPlaylist={newPlaylist}
        setNewPlaylist={setNewPlaylist}
        onSubmit={() => createMutation.mutate({ name: newPlaylist.name })}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

// ── CREATE MODAL ──
function CreatePlaylistModal({
  open,
  onOpenChange,
  newPlaylist,
  setNewPlaylist,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newPlaylist: { name: string; description: string };
  setNewPlaylist: (v: { name: string; description: string }) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nueva playlist</DialogTitle>
          <DialogDescription>
            Crea una playlist para organizar tu contenido multimedia.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre de la playlist *</Label>
            <Input
              placeholder="Ej: Promociones Q1"
              value={newPlaylist.name}
              onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
              className="bg-secondary/50 border-border/60"
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              placeholder="Describe el contenido de esta playlist..."
              value={newPlaylist.description}
              onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
              className="bg-secondary/50 border-border/60 resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!newPlaylist.name.trim() || isLoading}
            className="gradient-primary glow-primary-sm text-primary-foreground font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear playlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Playlists;
