import { memo } from "react";
import { Link2Off, MonitorPlay, Play, Images, MoreVertical, Pencil, MapPin, Eye, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { syncSeverity } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import type { NowPlayingInfo } from "./useNowPlaying";
import type { ScreenRow } from "./types";

interface Props {
  screen: ScreenRow;
  nowPlaying?: NowPlayingInfo;
  selected: boolean;
  selectionMode: boolean;
  /** Solo dueño o administrador ven la opción de eliminar. */
  canDelete: boolean;
  onToggle: (id: string, shiftKey: boolean) => void;
  onOpen: (id: string) => void;
  onChangeContent: (screen: ScreenRow) => void;
  onRename: (screen: ScreenRow) => void;
  onMove: (screen: ScreenRow) => void;
  onDelete: (screen: ScreenRow) => void;
}


/** Una pantalla es "en vivo" si reportó en los últimos 3 min (3 latidos). */
function isLive(lastSeenAt: string | null) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 180_000;
}

function ScreenTileBase({
  screen,
  nowPlaying,
  selected,
  selectionMode,
  canDelete,
  onToggle,
  onOpen,
  onChangeContent,
  onRename,
  onMove,
  onDelete,
}: Props) {

  const live = isLive(screen.last_seen_at);
  const neverPaired = !screen.last_seen_at && !screen.device_token;
  const sync = syncSeverity(screen.last_seen_at);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-stop]")) return;
        onOpen(screen.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(screen.id);
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border bg-card/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "v-selected" : "border-border/30 hover:border-primary/40",
      )}
    >
      {/* Lo que se ve AHORA, en 16:9 */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-secondary/40 via-secondary/20 to-background">
        {nowPlaying?.thumb ? (
          <img
            src={nowPlaying.thumb}
            alt={`Reproduciendo en ${screen.name}: ${nowPlaying.label}`}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition-opacity",
              live ? "" : "opacity-45 grayscale",
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MonitorPlay className={cn("h-8 w-8", live ? "text-muted-foreground/40" : "text-muted-foreground/20")} />
          </div>
        )}

        {/* Selección */}
        <div
          data-stop
          className={cn(
            "absolute left-2 top-2 transition-opacity",
            selectionMode || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
          )}
        >
          <Checkbox
            checked={selected}
            aria-label={`Seleccionar ${screen.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(screen.id, (e as unknown as MouseEvent).shiftKey);
            }}
            className="border-white/50 bg-background/70 backdrop-blur-md"
          />
        </div>

        {/* Acciones rápidas en hover */}
        <div
          data-stop
          className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-background/90 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
        >
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(screen.id); }}
            className="flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-[11px] font-medium backdrop-blur-md hover:bg-background"
          >
            <Play className="h-3 w-3" /> Ver en vivo
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onChangeContent(screen); }}
            className="flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-[11px] font-medium backdrop-blur-md hover:bg-background"
          >
            <Images className="h-3 w-3" /> Cambiar contenido
          </button>
        </div>
      </div>

      {/* Identidad: nombre completo hasta dos líneas */}
      <div className="space-y-1 p-2.5">
        <p className="line-clamp-2 min-h-[2.2em] text-[13px] font-medium leading-[1.1em]">
          {screen.name}
        </p>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span
            className={cn(
              "v-dot",
              live ? "v-dot-live" : neverPaired ? "v-dot-warning" : "v-dot-offline",
            )}
          />
          {neverPaired ? (
            <span className="text-amber-400">Sin vincular</span>
          ) : (
            <span className={sync.className}>{sync.label}</span>
          )}
        </div>
        {nowPlaying && (
          <p className="truncate text-[11px] text-muted-foreground" title={nowPlaying.label}>
            {nowPlaying.source === "programado" ? "Programado: " : "Lista: "}
            {nowPlaying.label}
          </p>
        )}
        {!nowPlaying && !neverPaired && (
          <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <Link2Off className="h-3 w-3" /> Sin contenido asignado
          </p>
        )}
      </div>
    </div>
  );
}

export const ScreenTile = memo(ScreenTileBase);
