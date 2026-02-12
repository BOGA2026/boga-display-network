import { cn } from "@/lib/utils";
import type { ScheduleLayer } from "@/hooks/useScheduleData";
import { Badge } from "@/components/ui/badge";

interface Props {
  layers: ScheduleLayer[];
  activeLayerId: string | null;
  onSelect: (id: string | null) => void;
}

const LayerTabs = ({ layers, activeLayerId, onSelect }: Props) => (
  <div className="flex items-center gap-1.5 overflow-x-auto">
    <button
      onClick={() => onSelect(null)}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
        activeLayerId === null
          ? "gradient-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:text-foreground border border-border"
      )}
    >
      Todas
    </button>
    {layers.map((l) => (
      <button
        key={l.id}
        onClick={() => onSelect(l.id)}
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5",
          activeLayerId === l.id
            ? "text-primary-foreground"
            : "bg-card text-muted-foreground hover:text-foreground border border-border"
        )}
        style={activeLayerId === l.id ? { background: l.color } : undefined}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
        {l.name}
        <Badge variant="outline" className="h-4 px-1 text-[10px] border-current/20">
          P{l.priority}
        </Badge>
      </button>
    ))}
  </div>
);

export default LayerTabs;
