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
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";
import { useMemo } from "react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  blocks: ScheduleBlock[];
  layers: ScheduleLayer[];
  conflicts: Map<string, string[]>;
  onReplace: (keepId: string, removeId: string) => void;
  onDismiss: () => void;
}

const ConflictAlertDialog = ({
  open,
  onOpenChange,
  blocks,
  layers,
  conflicts,
  onReplace,
  onDismiss,
}: Props) => {
  const layerMap = useMemo(() => {
    const m = new Map<string, ScheduleLayer>();
    layers.forEach((l) => m.set(l.id, l));
    return m;
  }, [layers]);

  // Get first conflict pair
  const pair = useMemo(() => {
    const seen = new Set<string>();
    for (const [id, others] of conflicts) {
      for (const otherId of others) {
        const key = [id, otherId].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);
        const a = blocks.find((b) => b.id === id);
        const b = blocks.find((bl) => bl.id === otherId);
        if (a && b) return [a, b] as [ScheduleBlock, ScheduleBlock];
      }
    }
    return null;
  }, [conflicts, blocks]);

  if (!pair) return null;

  const [blockA, blockB] = pair;
  const layerA = layerMap.get(blockA.layer_id);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Hay un choque de horarios
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Estos dos contenidos se muestran al mismo tiempo. ¿Cuál quieres mantener?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-3 my-4">
          {/* Block A */}
          <div
            className="flex-1 rounded-xl p-4 border-2"
            style={{
              borderColor: `${layerA?.color || "#8A00FF"}60`,
              background: `${layerA?.color || "#8A00FF"}10`,
            }}
          >
            <div className="text-sm font-bold truncate">{blockA.name || "Sin nombre"}</div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {blockA.start_time.slice(0, 5)} – {blockA.end_time.slice(0, 5)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {blockA.playlist?.name || "—"}
            </div>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />

          {/* Block B */}
          <div
            className="flex-1 rounded-xl p-4 border-2"
            style={{
              borderColor: `${layerA?.color || "#8A00FF"}60`,
              background: `${layerA?.color || "#8A00FF"}10`,
            }}
          >
            <div className="text-sm font-bold truncate">{blockB.name || "Sin nombre"}</div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {blockB.start_time.slice(0, 5)} – {blockB.end_time.slice(0, 5)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {blockB.playlist?.name || "—"}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            className="w-full gradient-primary text-primary-foreground rounded-xl h-11 text-sm"
            onClick={() => onReplace(blockB.id, blockA.id)}
          >
            Mantener "{(blockB.name || "nuevo").slice(0, 20)}" y reemplazar
          </AlertDialogAction>
          <AlertDialogAction
            className="w-full bg-secondary hover:bg-secondary/80 text-foreground rounded-xl h-11 text-sm"
            onClick={() => onReplace(blockA.id, blockB.id)}
          >
            Mantener "{(blockA.name || "anterior").slice(0, 20)}" y reemplazar
          </AlertDialogAction>
          <AlertDialogCancel
            className="w-full rounded-xl h-11 text-sm mt-0"
            onClick={onDismiss}
          >
            Dejar ambos por ahora
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConflictAlertDialog;
