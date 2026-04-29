import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MoreVertical } from "lucide-react";
import type { ScreenData } from "@/data/mockScreens";
import { Skeleton } from "@/components/ui/skeleton";
import { getScreenHealth } from "@/lib/screen-health";

interface ScreenCardProps {
  screen: ScreenData;
  onClick: () => void;
}

export function ScreenCard({ screen, onClick }: ScreenCardProps) {
  // Use real-time health based on lastSyncAt (which mirrors last_seen_at from DB)
  const health = getScreenHealth(screen.lastSyncAt);

  return (
    <button
      onClick={onClick}
      className="group glass-card rounded-xl overflow-hidden text-left transition-all hover:glass-card-hover hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img src={screen.currentContent.thumbnailUrl} alt={screen.currentContent.assetName} className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" loading="lazy" />
        <span className={`absolute right-2 top-2 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${health.className}`}>
          <span className={`h-2 w-2 rounded-full ${health.dotClass} ${health.status === "online" ? "animate-pulse" : ""}`} />
          {health.label}
        </span>
      </div>

      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{screen.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Última señal {formatDistanceToNow(new Date(screen.lastSyncAt), { addSuffix: true, locale: es })}
          </p>
        </div>
        <span className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={(e) => e.stopPropagation()} role="button" aria-label="Opciones de pantalla">
          <MoreVertical className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

export function ScreenCardSkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ScreenCardAdd({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Agregar nueva pantalla"
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-current">
          <span className="text-xl leading-none">+</span>
        </span>
        <span className="text-sm font-medium">Agregar pantalla</span>
      </div>
    </button>
  );
}
