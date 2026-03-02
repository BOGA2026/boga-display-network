import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import type { ScreenData } from "@/data/mockScreens";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  online: { icon: Wifi, label: "Online", className: "text-emerald-400 bg-emerald-400/10" },
  offline: { icon: WifiOff, label: "Offline", className: "text-muted-foreground bg-muted" },
  warning: { icon: AlertTriangle, label: "Warning", className: "text-amber-400 bg-amber-400/10" },
} as const;

interface ScreenCardProps {
  screen: ScreenData;
  onClick: () => void;
}

export function ScreenCard({ screen, onClick }: ScreenCardProps) {
  const st = statusConfig[screen.status];
  const StatusIcon = st.icon;

  return (
    <button
      onClick={onClick}
      className="group glass-card rounded-xl overflow-hidden text-left transition-all hover:glass-card-hover hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={screen.currentContent.thumbnailUrl}
          alt={screen.currentContent.assetName}
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          loading="lazy"
        />
        <span
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}
        >
          <StatusIcon className="h-3 w-3" />
          {st.label}
        </span>
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{screen.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Synced {formatDistanceToNow(new Date(screen.lastSyncAt), { addSuffix: true })}
          </p>
        </div>
        <span
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
          role="button"
          aria-label="Screen options"
        >
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
      aria-label="Add new screen"
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-current">
          <span className="text-xl leading-none">+</span>
        </span>
        <span className="text-sm font-medium">Add Screen</span>
      </div>
    </button>
  );
}
