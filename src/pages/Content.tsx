import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Plus,
  Image as ImageIcon,
  Film,
  Code2,
  Music,
  FileUp,
  Layers,
  LayoutGrid,
  X,
  Check,
  MoreVertical,
  Trash2,
  ListPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


interface ContentItem {
  id: string;
  name: string;
  type: string;
  file_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  created_at: string;
}

const ACCEPT_MAP: Record<string, string> = {
  image: "image/jpeg,image/png,image/gif,image/webp,image/svg+xml",
  video: "video/mp4,video/webm,video/quicktime",
  html: "text/html",
  audio: "audio/mpeg,audio/wav,audio/ogg",
};

const TYPE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  html: Code2,
  audio: Music,
  layout: LayoutGrid,
};

const SAMPLE_CONTENT = [
  { name: "Promo Helado Premium", type: "image", url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1920&q=80" },
  { name: "Menú Restaurante", type: "image", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=80" },
  { name: "Oferta del Día", type: "image", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80" },
  { name: "Bebidas Especiales", type: "image", url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1920&q=80" },
];

const Content = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [contentName, setContentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assign to playlist state
  const [assignTarget, setAssignTarget] = useState<ContentItem | null>(null);
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const openInEditor = (id: string) => {
    navigate(`/dashboard/editor?contentId=${id}`);
  };

  const getBusinessId = async (): Promise<string | null> => {
    const { data, error } = await supabase.rpc("get_user_business_id");
    if (error || !data) {
      toast({ title: "No estás asociado a un negocio", description: "Regístrate o contacta al administrador.", variant: "destructive" });
      return null;
    }
    return data;
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("content")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("content").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast({ title: "Contenido eliminado" });
    }
    setDeleteTarget(null);
  };

  const openAssignDialog = async (item: ContentItem) => {
    setAssignTarget(item);
    setSelectedPlaylistId("");
    const { data } = await supabase.from("playlists").select("id, name").order("name");
    setPlaylists(data ?? []);
  };

  const handleAssign = async () => {
    if (!assignTarget || !selectedPlaylistId) return;
    setAssigning(true);
    // Get max sort_order
    const { data: existing } = await supabase
      .from("playlist_items")
      .select("sort_order")
      .eq("playlist_id", selectedPlaylistId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
    const { error } = await supabase.from("playlist_items").insert({
      playlist_id: selectedPlaylistId,
      content_id: assignTarget.id,
      sort_order: nextOrder,
    });
    setAssigning(false);
    if (error) {
      toast({ title: "Error al asignar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Asignado a playlist", description: `"${assignTarget.name}" agregado correctamente.` });
    }
    setAssignTarget(null);
  };

  const resetUploadForm = () => {
    setSelectedType(null);
    setContentName("");
    setSelectedFile(null);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!contentName) {
      setContentName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleAddSampleContent = async () => {
    setLoadingSamples(true);
    const businessId = await getBusinessId();
    if (!businessId) { setLoadingSamples(false); return; }

    const inserts = SAMPLE_CONTENT.map((s) => ({
      name: s.name,
      type: s.type,
      file_url: s.url,
      business_id: businessId,
    }));

    const { error } = await supabase.from("content").insert(inserts);
    setLoadingSamples(false);

    if (error) {
      toast({ title: "Error al agregar contenido de prueba", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Contenido de prueba agregado", description: `${SAMPLE_CONTENT.length} archivos añadidos.` });
    fetchContent();
  };

  const handleUpload = async () => {
    if (!selectedFile || !contentName.trim() || !selectedType) return;

    setUploading(true);

    const businessId = await getBusinessId();
    if (!businessId) { setUploading(false); return; }

    const ext = selectedFile.name.split(".").pop();
    const filePath = `${businessId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, selectedFile);

    if (uploadError) {
      toast({ title: "Error al subir archivo", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);

    const { error: dbError } = await supabase.from("content").insert({
      name: contentName.trim(),
      type: selectedType,
      file_url: urlData.publicUrl,
      business_id: businessId,
    });

    setUploading(false);

    if (dbError) {
      toast({ title: "Error al guardar registro", description: dbError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Contenido agregado" });
    setUploadOpen(false);
    resetUploadForm();
    fetchContent();
  };

  const hasContent = items.length > 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Contenido</h1>
          <p className="text-sm text-muted-foreground">Gestiona el contenido multimedia de tus pantallas</p>
        </div>
        {hasContent && (
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleAddSampleContent}
              disabled={loadingSamples}
              className="gap-2 border-accent/40 text-accent-foreground hover:bg-accent/10"
            >
              <Layers className="h-4 w-4" />
              {loadingSamples ? "Agregando…" : "Contenido de prueba"}
            </Button>
            <Button
              onClick={() => { resetUploadForm(); setUploadOpen(true); }}
              className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2 px-5 font-semibold"
            >
              <Plus className="h-4 w-4" />
              Agregar contenido
            </Button>
          </div>
        )}
      </div>

      {/* Main area */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : hasContent ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? ImageIcon;
            return (
              <Card
                key={item.id}
                className="surface-elevated border-border/30 overflow-hidden transition-all hover:border-primary/30 hover:glow-primary-sm group cursor-pointer"
                onClick={(e) => {
                  // Don't navigate if clicking on dropdown menu area
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-radix-collection-item]') || target.closest('[role="menu"]')) return;
                  if (item.type === "layout") openInEditor(item.id);
                }}
              >
                {/* Thumbnail area */}
                <div className="relative aspect-video bg-secondary/50 flex items-center justify-center overflow-hidden">
                  {item.type === "image" && item.file_url ? (
                    <img src={item.file_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : item.type === "video" && item.file_url ? (
                    <video src={item.file_url} className="h-full w-full object-cover" muted />
                  ) : item.type === "layout" ? (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <LayoutGrid className="h-7 w-7 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">Plantilla de editor</span>
                    </div>
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground/40" />
                  )}
                  <div className="absolute top-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                    {item.type === "layout" ? "Layout" : item.type}
                  </div>
                </div>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {item.type === "layout" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openInEditor(item.id); }}>
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          Editar en canvas
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAssignDialog(item); }}>
                        <ListPlus className="mr-2 h-4 w-4" />
                        Asignar a playlist
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl gradient-primary glow-primary animate-pulse-glow">
              <Upload className="h-12 w-12 text-primary-foreground" />
            </div>
            {/* Floating accent icons */}
            <div className="absolute -top-2 -right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border/50">
              <ImageIcon className="h-4 w-4 text-primary/70" />
            </div>
            <div className="absolute -bottom-2 -left-4 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border/50">
              <Film className="h-4 w-4 text-accent/70" />
            </div>
          </div>

          <h2 className="font-display text-xl font-bold mb-2">Subir contenido</h2>
          <p className="text-sm text-muted-foreground mb-10 max-w-md leading-relaxed">
            Agrega imágenes, videos, archivos HTML o contenido multimedia para tus pantallas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => { resetUploadForm(); setUploadOpen(true); }}
              className="gradient-primary hover:gradient-primary-hover glow-primary text-primary-foreground border-0 gap-2 px-8 py-3 text-base font-semibold"
              size="lg"
            >
              <FileUp className="h-5 w-5" />
              Agregar contenido
            </Button>
            <Button
              variant="outline"
              onClick={handleAddSampleContent}
              disabled={loadingSamples}
              className="gap-2 border-accent/40 text-accent-foreground hover:bg-accent/10 px-8 py-3 text-base"
              size="lg"
            >
              <Layers className="h-5 w-5" />
              {loadingSamples ? "Agregando…" : "Contenido de prueba"}
            </Button>
          </div>
        </div>
      )}

      {/* ========== Upload Dialog ========== */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Agregar contenido</DialogTitle>
            <DialogDescription>Sube archivos multimedia para usar en tus pantallas.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Type selector */}
            <div className="space-y-2">
              <Label>Tipo de contenido</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["image", "video", "html", "audio"] as const).map((type) => {
                  const Icon = TYPE_ICONS[type];
                  const labels: Record<string, string> = { image: "Imagen", video: "Video", html: "HTML", audio: "Audio" };
                  return (
                    <button
                      key={type}
                      onClick={() => { setSelectedType(type); setSelectedFile(null); }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all",
                        selectedType === type
                          ? "border-primary/60 bg-primary/10 text-primary glow-primary-sm"
                          : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {labels[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="content-name">Nombre *</Label>
              <Input
                id="content-name"
                placeholder="Mi contenido"
                value={contentName}
                onChange={(e) => setContentName(e.target.value)}
              />
            </div>

            {/* Drop zone */}
            {selectedType && (
              <div className="space-y-2">
                <Label>Archivo</Label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
                    dragOver
                      ? "border-primary bg-primary/5 glow-primary-sm"
                      : selectedFile
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/50 hover:border-primary/30"
                  )}
                >
                  {selectedFile ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                        <Check className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        className="ml-2 rounded-md p-1 hover:bg-secondary"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Arrastra un archivo aquí o <span className="text-primary font-medium">haz clic para seleccionar</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        Máximo 50MB
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPT_MAP[selectedType] ?? ""}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !contentName.trim() || !selectedType}
              className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2"
            >
              <FileUp className="h-4 w-4" />
              {uploading ? "Subiendo..." : "Subir contenido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Delete Confirmation ========== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== Assign to Playlist ========== */}
      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Asignar a playlist</DialogTitle>
            <DialogDescription>
              Agrega "{assignTarget?.name}" a una playlist existente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Playlist</Label>
            <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecciona una playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {playlists.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No hay playlists disponibles.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignTarget(null)}>Cancelar</Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || !selectedPlaylistId}
              className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2"
            >
              <ListPlus className="h-4 w-4" />
              {assigning ? "Asignando…" : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Content;
