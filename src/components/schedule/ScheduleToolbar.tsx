import { Button } from "@/components/ui/button";
import { Plus, ZoomIn, ZoomOut, FileText, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PRESETS } from "@/hooks/useScheduleData";

interface Props {
  zoom: number;
  onZoomChange: (z: number) => void;
  onAddBlock: () => void;
  onApplyPreset: (start: string, end: string, label: string) => void;
  onOpenTemplates: () => void;
}

const ZOOM_LEVELS = [60, 30, 15];

const ScheduleToolbar = ({ zoom, onZoomChange, onAddBlock, onApplyPreset, onOpenTemplates }: Props) => {
  const zoomIn = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx < ZOOM_LEVELS.length - 1) onZoomChange(ZOOM_LEVELS[idx + 1]);
  };
  const zoomOut = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx > 0) onZoomChange(ZOOM_LEVELS[idx - 1]);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Add block */}
      <Button size="sm" className="gradient-primary text-primary-foreground gap-1.5" onClick={onAddBlock}>
        <Plus className="h-3.5 w-3.5" />
        Nuevo bloque
      </Button>

      {/* Presets */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Presets
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {PRESETS.map((p) => (
            <DropdownMenuItem key={p.label} onClick={() => onApplyPreset(p.start, p.end, p.label)}>
              {p.label} ({p.start}–{p.end})
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Templates */}
      <Button size="sm" variant="outline" className="gap-1.5" onClick={onOpenTemplates}>
        <FileText className="h-3.5 w-3.5" />
        Plantillas
      </Button>

      {/* Zoom */}
      <div className="ml-auto flex items-center gap-1 bg-card rounded-md border border-border px-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={zoomOut} disabled={zoom === 60}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground w-8 text-center">{zoom}m</span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={zoomIn} disabled={zoom === 15}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default ScheduleToolbar;
