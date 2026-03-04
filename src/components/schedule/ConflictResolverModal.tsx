import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";
import { useMemo } from "react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  blocks: ScheduleBlock[];
  layers: ScheduleLayer[];
  conflicts: Map<string, string[]>;
  onSelectBlock: (id: string) => void;
  onDisableBlock: (id: string) => void;
}

const ConflictResolverModal = ({
  open,
  onOpenChange,
  blocks,
  layers,
  conflicts,
  onSelectBlock,
  onDisableBlock,
}: Props) => {
  const layerMap = useMemo(() => {
    const m = new Map<string, ScheduleLayer>();
    layers.forEach((l) => m.set(l.id, l));
    return m;
  }, [layers]);

  // Build unique conflict pairs
  const pairs = useMemo(() => {
    const seen = new Set<string>();
    const result: [ScheduleBlock, ScheduleBlock][] = [];
    conflicts.forEach((others, id) => {
      others.forEach((otherId) => {
        const key = [id, otherId].sort().join("-");
        if (seen.has(key)) return;
        seen.add(key);
        const a = blocks.find((b) => b.id === id);
        const b = blocks.find((bl) => bl.id === otherId);
        if (a && b) result.push([a, b]);
      });
    });
    return result;
  }, [conflicts, blocks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Conflictos detectados
          </DialogTitle>
          <DialogDescription>
            {pairs.length} solapamiento{pairs.length !== 1 && "s"} de horario en la misma capa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {pairs.map(([a, b], i) => {
            const layerA = layerMap.get(a.layer_id);
            return (
              <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: layerA?.color }} />
                  {layerA?.name} · Solapamiento #{i + 1}
                </div>
                <div className="flex items-center gap-3">
                  {/* Block A */}
                  <div className="flex-1 rounded-md bg-secondary/40 p-2">
                    <div className="text-xs font-medium truncate">{a.name || "Sin nombre"}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  {/* Block B */}
                  <div className="flex-1 rounded-md bg-secondary/40 p-2">
                    <div className="text-xs font-medium truncate">{b.name || "Sin nombre"}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1 h-7"
                    onClick={() => {
                      onSelectBlock(a.id);
                      onOpenChange(false);
                    }}
                  >
                    Editar "{a.name?.slice(0, 12) || "A"}"
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1 h-7"
                    onClick={() => {
                      onDisableBlock(b.id);
                    }}
                  >
                    Desactivar "{b.name?.slice(0, 12) || "B"}"
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {pairs.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No hay conflictos activos. ¡Todo limpio!
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolverModal;
