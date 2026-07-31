import { Image as ImageIcon, Film, Code2, Music, LayoutGrid, MoreVertical, Trash2, ListPlus, MonitorPlay, Eye, Check, RefreshCw, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { storageThumb } from "@/lib/storageImage";
import {
  MediaDims,
  formatBytes,
  formatDims,
  formatDuration,
  isHeavyFile,
  HEAVY_FILE_TOOLTIP,
  metaLine,
  ratioLabel,
  relativeDate,
  typeLabel,
} from "./mediaMeta";

export interface ContentItem {
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


export const TYPE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  html: Code2,
  audio: Music,
  layout: LayoutGrid,
  menu: LayoutGrid,
};

interface Props {
  item: ContentItem;
  dims?: MediaDims | null;
  onDims: (id: string, dims: MediaDims) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  selectionActive: boolean;
  dimmed?: boolean;
  onOpen: () => void;
  onPreview: () => void;
  onAssign: () => void;
  onSend: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onRetryThumb?: () => void;
}

export function ContentCard({
  item,
  dims,
  onDims,
  selected,
  onToggleSelect,
  selectionActive,
  dimmed,
  onOpen,
  onPreview,
  onAssign,
  onSend,
  onDelete,
  onEdit,
  onRetryThumb,
}: Props) {
  const Icon = TYPE_ICONS[item.type] ?? ImageIcon;
  const ratio = ratioLabel(dims);
  const duration = formatDuration(item.duration_seconds);
  const thumbSrc = item.thumbnail_url ?? (item.type === "image" ? item.file_url : null);
  const thumbPending = !thumbSrc && item.thumbnail_status === "pendiente";
  const heavy = isHeavyFile(item.file_size_bytes);
  const sizeLabel = formatBytes(item.file_size_bytes);


  const card = (
    <div
      className={cn(
        "v-card group relative overflow-hidden rounded-xl border border-border/30 surface-elevated transition-all",
        "hover:border-primary/30 hover:glow-primary-sm cursor-pointer",
        selected && "border-primary/60 glow-primary-sm",
        dimmed && "opacity-40",
      )}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-card-action]") || target.closest('[role="menu"]')) return;
        if (selectionActive) { onToggleSelect(item.id); return; }
        onOpen();
      }}
    >
      {/* Miniatura: marco 16:9 fijo, pieza dentro con su proporción real */}
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[hsl(var(--admin-surface-2,var(--muted)))]">
        {thumbSrc ? (
          <img
            src={storageThumb(thumbSrc, { width: 480, resize: "contain" })}
            alt={item.name}
            width={480}
            height={270}
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              const el = e.currentTarget;
              if (el.naturalWidth) onDims(item.id, { width: el.naturalWidth, height: el.naturalHeight });
            }}
            className="h-full w-full object-contain"
          />
        ) : item.type === "video" && item.file_url ? (
          <video
            src={item.file_url}
            className="h-full w-full object-contain"
            muted
            preload="metadata"
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              if (el.videoWidth) onDims(item.id, { width: el.videoWidth, height: el.videoHeight });
            }}
          />
        ) : (
          <Icon className="h-10 w-10 text-muted-foreground opacity-30" />
        )}

        {/* Chip de tipo */}
        <span className="v-thumb-chip right-2 top-2 bg-black/50">{typeLabel(item.type)}</span>

        {/* Chip de orientación */}
        {ratio && <span className="v-thumb-chip bottom-2 left-2 bg-black/60">{ratio}</span>}

        {/* Duración de video */}
        {item.type === "video" && duration && (
          <span className="v-thumb-chip bottom-2 right-2 bg-black/60">{duration}</span>
        )}

        {/* Checkbox de selección */}
        <button
          data-card-action
          aria-label={selected ? "Quitar de la selección" : "Seleccionar"}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
          className={cn(
            "absolute left-2 top-2 z-[3] flex h-5 w-5 items-center justify-center rounded border border-white/40 bg-black/50 transition-opacity",
            selected
              ? "opacity-100 border-primary bg-primary text-primary-foreground"
              : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 md:opacity-0",
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </button>

        {/* Acciones rápidas en hover */}
        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            data-card-action
            onClick={(e) => { e.stopPropagation(); onAssign(); }}
            className="rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-background"
          >
            <ListPlus className="mr-1 inline h-3 w-3" />
            Agregar a lista
          </button>
          <button
            data-card-action
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-background"
          >
            <Eye className="mr-1 inline h-3 w-3" />
            Vista previa
          </button>
        </div>
      </div>

      {/* Pie: nombre + metadata */}
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-tight">{item.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {metaLine([formatDims(dims), duration, relativeDate(item.created_at)])}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-card-action
              aria-label="Más acciones"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 rounded-md p-1 text-muted-foreground opacity-100 transition hover:bg-secondary hover:text-foreground focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Editar en canvas
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssign(); }}>
              <ListPlus className="mr-2 h-4 w-4" />
              Agregar a lista
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSend(); }}>
              <MonitorPlay className="mr-2 h-4 w-4" />
              Enviar a pantalla
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  if (!dimmed) return card;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent>Orientación distinta a la de esta pantalla</TooltipContent>
    </Tooltip>
  );
}
