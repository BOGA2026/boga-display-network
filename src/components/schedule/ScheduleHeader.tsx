import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Wifi, WifiOff, Upload, Save, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Screen {
  id: string;
  name: string;
  status: string;
  last_seen_at?: string | null;
  last_sync_at?: string | null;
  locations?: { name: string } | null;
}

interface Props {
  screens: Screen[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  hasUnpublished: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
  isPublishing: boolean;
  isSaving: boolean;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

const ScheduleHeader = ({
  screens,
  selectedId,
  onSelect,
  hasUnpublished,
  onPublish,
  onSaveDraft,
  isPublishing,
  isSaving,
}: Props) => {
  const screen = screens.find((s) => s.id === selectedId);
  const isOnline = screen?.status === "online";

  return (
    <div className="flex items-center gap-3 flex-wrap border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3 rounded-xl">
      {/* Screen selector */}
      <div className="flex items-center gap-2">
        <Monitor className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedId || ""} onValueChange={onSelect}>
          <SelectTrigger className="w-[240px] bg-secondary/60 border-border h-9">
            <SelectValue placeholder="Seleccionar pantalla…" />
          </SelectTrigger>
          <SelectContent>
            {screens.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: s.status === "online" ? "hsl(142 71% 45%)" : "hsl(var(--muted-foreground))" }}
                  />
                  {s.name}
                  {(s as any).locations?.name && (
                    <span className="text-xs text-muted-foreground">— {(s as any).locations.name}</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Device status */}
      {screen && (
        <div className="flex items-center gap-2 text-xs">
          <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1",
            isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"
          )}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? "Online" : "Offline"}
          </div>
          <span className="text-muted-foreground">
            Sync: {timeAgo(screen.last_sync_at)}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Unpublished badge */}
      {hasUnpublished && (
        <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 gap-1 animate-pulse">
          <RefreshCw className="h-3 w-3" />
          Cambios sin publicar
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8"
          onClick={onSaveDraft}
          disabled={isSaving || !hasUnpublished}
        >
          <Save className="h-3.5 w-3.5" />
          Guardar borrador
        </Button>
        <Button
          size="sm"
          className="gradient-primary text-primary-foreground gap-1.5 h-8 glow-primary-sm"
          onClick={onPublish}
          disabled={isPublishing || !hasUnpublished}
        >
          <Upload className="h-3.5 w-3.5" />
          {isPublishing ? "Publicando…" : "Publicar ahora"}
        </Button>
      </div>
    </div>
  );
};

export default ScheduleHeader;
