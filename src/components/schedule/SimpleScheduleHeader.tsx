import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Wifi, WifiOff, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Screen {
  id: string;
  name: string;
  status: string;
  last_sync_at?: string | null;
  locations?: { name: string } | null;
}

interface Props {
  screens: Screen[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  isPublished: boolean;
  onUndo: () => void;
  hasChanges: boolean;
}

const SimpleScheduleHeader = ({
  screens,
  selectedId,
  onSelect,
  isPublished,
  onUndo,
  hasChanges,
}: Props) => {
  const screen = screens.find((s) => s.id === selectedId);
  const isOnline = screen?.status === "online";

  return (
    <div className="flex items-center gap-4 flex-wrap px-5 py-4 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
      {/* Screen selector */}
      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Monitor className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block">
            Pantalla
          </label>
          <Select value={selectedId || ""} onValueChange={onSelect}>
            <SelectTrigger className="h-10 text-base font-medium bg-secondary/50 border-border/50 rounded-xl">
              <SelectValue placeholder="Elige una pantalla…" />
            </SelectTrigger>
            <SelectContent>
              {screens.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-base py-3">
                  <span className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: s.status === "online" ? "hsl(142 71% 45%)" : "hsl(var(--muted-foreground))" }}
                    />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Device status */}
      {screen && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            )}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? "Conectada" : "Desconectada"}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? "La pantalla está recibiendo contenido" : "La pantalla no está conectada a internet"}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Publish status */}
      <Badge
        variant="outline"
        className={cn(
          "text-sm px-4 py-2 rounded-xl font-medium",
          isPublished && !hasChanges
            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            : "border-amber-500/30 text-amber-400 bg-amber-500/10 animate-pulse"
        )}
      >
        {isPublished && !hasChanges ? "✓ Publicado" : "● Sin publicar"}
      </Badge>

      {/* Undo */}
      {hasChanges && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl gap-2 text-sm h-10"
              onClick={onUndo}
            >
              <RotateCcw className="h-4 w-4" />
              Deshacer cambios
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Volver al último estado publicado</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default SimpleScheduleHeader;
