import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/query-client";
import { pageQueryKeys } from "@/lib/routePrefetch";
import { PAGE_STALE_TIME, fetchContentList } from "@/lib/pageQueries";
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
  Sparkles,
  PenTool,
  MonitorPlay,
  Rows3,
  Grid2X2,
} from "lucide-react";
import { SendToScreenSheet } from "@/components/dashboard/SendToScreenSheet";
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
import { storageThumb } from "@/lib/storageImage";
import { NAV, COPY } from "@/config/lexicon";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/feedback/states";
import { getBusinessId as resolveBusinessId, getUserId } from "@/features/auth/tenant";
import { ContentCard, ContentItem as CardContentItem } from "@/components/content/ContentCard";
import { ContentTable } from "@/components/content/ContentTable";
import { MediaDims, orientationOf, typeLabel, formatDims, formatDuration, relativeDate } from "@/components/content/mediaMeta";


interface ContentItem {
  id: string;
  name: string;
  type: string;
  file_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes?: number | null;
  thumbnail_status?: string | null;
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
  const [loadError, setLoadError] = useState(false);
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assign to playlist state
  const [assignTarget, setAssignTarget] = useState<ContentItem | null>(null);
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [bulkAssign, setBulkAssign] = useState(false);

  // Send to screen state
  const [sendTarget, setSendTarget] = useState<ContentItem | null>(null);

  // Vista previa
  const [previewTarget, setPreviewTarget] = useState<ContentItem | null>(null);

  // Vista cuadrícula / lista (preferencia persistida)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    return localStorage.getItem("visualia_content_view") === "list" ? "list" : "grid";
  });
  useEffect(() => {
    localStorage.setItem("visualia_content_view", viewMode);
  }, [viewMode]);

  // Filtro de orientación (atenúa las piezas que no coinciden)
  const [orientFilter, setOrientFilter] = useState<"todas" | "horizontal" | "vertical">("todas");

  // Dimensiones reales medidas al cargar cada miniatura
  const [dims, setDims] = useState<Record<string, MediaDims>>({});
  const handleDims = useCallback((id: string, d: MediaDims) => {
    setDims((prev) => (prev[id]?.width === d.width && prev[id]?.height === d.height ? prev : { ...prev, [id]: d }));
  }, []);

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const clearSelection = () => setSelectedIds(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const isDimmed = useCallback(
    (id: string) => {
      if (orientFilter === "todas") return false;
      const o = orientationOf(dims[id]);
      return !!o && o !== orientFilter;
    },
    [orientFilter, dims],
  );

  const openInEditor = (id: string) => {
    navigate(`/dashboard/editor?contentId=${id}`);
  };

  const getBusinessId = async (): Promise<string | null> => {
    const data = await resolveBusinessId();
    if (!data) {
      toast({ title: "No estás asociado a un negocio", description: "Regístrate o contacta al administrador.", variant: "destructive" });
      return null;
    }
    return data;
  };

  useEffect(() => {
    fetchContent({ fresh: false });
  }, []);

  const fetchContent = async ({ fresh = true }: { fresh?: boolean } = {}) => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await queryClient.fetchQuery({
        queryKey: pageQueryKeys.contentList,
        queryFn: fetchContentList,
        staleTime: fresh ? 0 : PAGE_STALE_TIME,
      });
      setItems(data as any);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
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

  const openBulkAssign = async () => {
    setBulkAssign(true);
    setSelectedPlaylistId("");
    const { data } = await supabase.from("playlists").select("id, name").order("name");
    setPlaylists(data ?? []);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("content").delete().in("id", ids);
    setBulkDeleting(false);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((x) => !selectedIds.has(x.id)));
    clearSelection();
    toast({ title: `${ids.length} ${ids.length === 1 ? "pieza eliminada" : "piezas eliminadas"}` });
  };

  const openAssignDialog = async (item: ContentItem) => {
    setBulkAssign(false);
    setAssignTarget(item);
    setSelectedPlaylistId("");
    const { data } = await supabase.from("playlists").select("id, name").order("name");
    setPlaylists(data ?? []);
  };

  const handleAssign = async () => {
    if (!selectedPlaylistId) return;
    const targets = bulkAssign
      ? items.filter((i) => selectedIds.has(i.id))
      : assignTarget
        ? [assignTarget]
        : [];
    if (targets.length === 0) return;
    setAssigning(true);
    // Get max sort_order
    const { data: existing } = await supabase
      .from("playlist_items")
      .select("sort_order")
      .eq("playlist_id", selectedPlaylistId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
    const { error } = await supabase.from("playlist_items").insert(
      targets.map((t, idx) => ({
        playlist_id: selectedPlaylistId,
        content_id: t.id,
        sort_order: nextOrder + idx,
      })),
    );
    setAssigning(false);
    if (error) {
      toast({ title: "Error al agregar", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Agregado a la lista",
        description:
          targets.length === 1
            ? `"${targets[0].name}" agregado correctamente.`
            : `${targets.length} piezas agregadas correctamente.`,
      });
      if (bulkAssign) clearSelection();
    }
    setAssignTarget(null);
    setBulkAssign(false);
  };

  const resetUploadForm = () => {
    setSelectedType(null);
    setContentName("");
    setSelectedFile(null);
  };

  const MAX_FILE_MB = 100;

  const handleFileSelect = (file: File) => {
    const sizeMb = file.size / 1024 / 1024;
    if (sizeMb > MAX_FILE_MB) {
      toast({
        title: "Archivo demasiado pesado",
        description: `Tu archivo pesa ${sizeMb.toFixed(1)} MB. El máximo permitido es ${MAX_FILE_MB} MB. Comprime el video o reduce su calidad antes de subirlo.`,
        variant: "destructive",
      });
      return;
    }
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

    // Tope duro: por encima de esto el reproductor de la pantalla sufre.
    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      toast({
        title: "Archivo demasiado pesado",
        description: `Pesa ${formatBytes(selectedFile.size)} y el máximo es 250 MB. Comprimí el archivo (bajá la resolución o el bitrate) y volvé a intentar.`,
        variant: "destructive",
      });
      return;
    }

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
      file_size_bytes: selectedFile.size,
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

  // Filtro por IDs (llega desde la tarjeta de contenido huérfano en Analíticas).
  const idsParam = searchParams.get("ids");
  const filtroIds = useMemo(
    () => (idsParam ? idsParam.split(",").filter(Boolean) : null),
    [idsParam],
  );
  const visibleItems = useMemo(
    () => (filtroIds ? items.filter((i) => filtroIds.includes(i.id)) : items),
    [items, filtroIds],
  );

  const hasContent = visibleItems.length > 0;


  return (
    <div className="v-page">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{NAV.contenido.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{NAV.contenido.pageSubtitle}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Button
            onClick={() => { resetUploadForm(); setUploadOpen(true); }}
            className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2 px-5 font-semibold"
          >
            <Upload className="h-4 w-4" />
            Subir archivo
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/generar-ia")}
            className="gap-2 border-primary/40 hover:bg-primary/10"
          >
            <Sparkles className="h-4 w-4" />
            Crear con IA
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/editor")}
            className="gap-2 border-accent/40 hover:bg-accent/10"
          >
            <PenTool className="h-4 w-4" />
            Diseñar en editor
          </Button>
          {hasContent && (
            <Button
              variant="ghost"
              onClick={handleAddSampleContent}
              disabled={loadingSamples}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Layers className="h-4 w-4" />
              {loadingSamples ? "Agregando…" : "Contenido de prueba"}
            </Button>
          )}
        </div>
      </div>

      {/* Filtro activo (llega desde Analíticas: archivos sin reproducir) */}
      {filtroIds && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
          <p className="text-sm text-foreground">
            Mostrando {visibleItems.length} {visibleItems.length === 1 ? "archivo" : "archivos"} sin
            reproducciones en los últimos 30 días.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("ids");
              setSearchParams(next, { replace: true });
            }}
          >
            Quitar filtro
          </Button>
        </div>
      )}

      {/* Main area */}
      {/* Barra de vista: filtros + conmutador cuadrícula/lista */}
      {hasContent && !loading && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Select value={orientFilter} onValueChange={(v) => setOrientFilter(v as any)}>
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <SelectValue placeholder="Orientación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las orientaciones</SelectItem>
                <SelectItem value="horizontal">Pantalla horizontal (16:9)</SelectItem>
                <SelectItem value="vertical">Pantalla vertical (9:16)</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {visibleItems.length} {visibleItems.length === 1 ? "pieza" : "piezas"}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/40 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Ver en cuadrícula"
              aria-pressed={viewMode === "grid"}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors",
                viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Grid2X2 className="h-3.5 w-3.5" />
              Cuadrícula
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label="Ver en lista"
              aria-pressed={viewMode === "list"}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors",
                viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Rows3 className="h-3.5 w-3.5" />
              Lista
            </button>
          </div>
        </div>
      )}

      {/* Barra de acciones sobre la selección */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <span className="text-sm font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? "pieza seleccionada" : "piezas seleccionadas"}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={openBulkAssign}>
              <ListPlus className="h-4 w-4" />
              Agregar a lista
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => {
                const first = visibleItems.find((i) => selectedIds.has(i.id));
                if (first) setSendTarget(first);
              }}
            >
              <MonitorPlay className="h-4 w-4" />
              Mover a pantalla
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {bulkDeleting ? "Eliminando…" : "Eliminar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Main area */}
      {loading ? (
        <CardGridSkeleton count={8} columns={4} className="gap-4" />
      ) : loadError ? (
        <ErrorState description={COPY.error.content} onRetry={fetchContent} />
      ) : hasContent ? (
        viewMode === "list" ? (
          <ContentTable
            items={visibleItems as CardContentItem[]}
            dims={dims}
            onDims={handleDims}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            isDimmed={isDimmed}
            onOpen={(item) => {
              if (item.type === "layout" || item.type === "menu") openInEditor(item.id);
              else setPreviewTarget(item as ContentItem);
            }}
            onAssign={(item) => openAssignDialog(item as ContentItem)}
            onSend={(item) => setSendTarget(item as ContentItem)}
            onDelete={(item) => setDeleteTarget(item as ContentItem)}
            onEdit={(item) => openInEditor(item.id)}
          />
        ) : (
          <div className="v-media-grid">
            {visibleItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item as CardContentItem}
                dims={dims[item.id]}
                onDims={handleDims}
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                selectionActive={selectedIds.size > 0}
                dimmed={isDimmed(item.id)}
                onOpen={() => {
                  if (item.type === "layout" || item.type === "menu") openInEditor(item.id);
                  else setPreviewTarget(item);
                }}
                onPreview={() => setPreviewTarget(item)}
                onAssign={() => openAssignDialog(item)}
                onSend={() => setSendTarget(item)}
                onDelete={() => setDeleteTarget(item)}
                onEdit={
                  item.type === "layout" || item.type === "menu"
                    ? () => openInEditor(item.id)
                    : undefined
                }
              />
            ))}
          </div>
        )

      ) : (
        <EmptyState
          icon={<Upload className="h-9 w-9" />}
          title={COPY.empty.contentTitle}
          description={COPY.empty.content}
          action={
            <Button
              onClick={() => { resetUploadForm(); setUploadOpen(true); }}
              className="gradient-primary hover:gradient-primary-hover glow-primary text-primary-foreground border-0 gap-2 px-8 py-3 text-base font-semibold"
              size="lg"
            >
              <FileUp className="h-5 w-5" />
              Agregar contenido
            </Button>
          }
          secondaryAction={
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
          }
        />

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
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Máximo 100 MB
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
      <Dialog
        open={!!assignTarget || bulkAssign}
        onOpenChange={(open) => {
          if (!open) { setAssignTarget(null); setBulkAssign(false); }
        }}
      >
        <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Agregar a lista</DialogTitle>
            <DialogDescription>
              {bulkAssign
                ? `Agrega ${selectedIds.size} piezas a una lista existente.`
                : `Agrega "${assignTarget?.name}" a una lista existente.`}
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
            <Button variant="ghost" onClick={() => { setAssignTarget(null); setBulkAssign(false); }}>Cancelar</Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || !selectedPlaylistId}
              className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2"
            >
              <ListPlus className="h-4 w-4" />
              {assigning ? "Agregando…" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Vista previa ========== */}
      <Dialog open={!!previewTarget} onOpenChange={(o) => !o && setPreviewTarget(null)}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">{previewTarget?.name}</DialogTitle>
            <DialogDescription>
              {previewTarget
                ? [
                    typeLabel(previewTarget.type),
                    formatDims(dims[previewTarget.id]),
                    formatDuration(previewTarget.duration_seconds),
                    relativeDate(previewTarget.created_at),
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-[hsl(var(--admin-surface-2,var(--muted)))]">
            {previewTarget?.type === "video" && previewTarget.file_url ? (
              <video src={previewTarget.file_url} className="h-full w-full object-contain" controls autoPlay muted />
            ) : previewTarget?.thumbnail_url || previewTarget?.file_url ? (
              <img
                src={previewTarget.thumbnail_url ?? previewTarget.file_url ?? ""}
                alt={previewTarget.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground opacity-30" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SendToScreenSheet
        open={!!sendTarget}
        onOpenChange={(o) => !o && setSendTarget(null)}
        contentId={sendTarget?.id}
        contentLabel={sendTarget?.name}
      />

    </div>
  );
};

export default Content;
