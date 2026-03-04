import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { ScheduleBlock } from "@/hooks/useScheduleData";

const DAYS_LABELS = [
  { value: 1, label: "Lunes", short: "L" },
  { value: 2, label: "Martes", short: "M" },
  { value: 3, label: "Miércoles", short: "X" },
  { value: 4, label: "Jueves", short: "J" },
  { value: 5, label: "Viernes", short: "V" },
  { value: 6, label: "Sábado", short: "S" },
  { value: 0, label: "Domingo", short: "D" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  blocks: ScheduleBlock[];
  onCopy: (sourceDayIndex: number, targetDays: number[]) => void;
}

const CopyToDaysDialog = ({ open, onOpenChange, blocks, onCopy }: Props) => {
  const [sourceDay, setSourceDay] = useState<number | null>(null);
  const [targetDays, setTargetDays] = useState<number[]>([]);

  const daysWithBlocks = DAYS_LABELS.filter((d) =>
    blocks.some((b) => b.days_of_week.includes(d.value) && b.is_enabled)
  );

  const toggleTarget = (d: number) => {
    setTargetDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleCopy = () => {
    if (sourceDay !== null && targetDays.length > 0) {
      onCopy(sourceDay, targetDays);
      onOpenChange(false);
      setSourceDay(null);
      setTargetDays([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Copiar a otros días</DialogTitle>
          <DialogDescription>
            Elige un día como origen y luego selecciona los días donde quieres copiarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Source day */}
          <div className="space-y-2">
            <label className="text-sm font-medium">¿De qué día copiar?</label>
            <div className="flex gap-2 flex-wrap">
              {daysWithBlocks.map((d) => (
                <button
                  key={d.value}
                  onClick={() => {
                    setSourceDay(d.value);
                    setTargetDays([]);
                  }}
                  className={cn(
                    "h-11 px-4 rounded-xl text-sm font-semibold transition-all",
                    sourceDay === d.value
                      ? "gradient-primary text-primary-foreground glow-primary-sm"
                      : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {daysWithBlocks.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay días con contenido para copiar.</p>
            )}
          </div>

          {/* Target days */}
          {sourceDay !== null && (
            <div className="space-y-2">
              <label className="text-sm font-medium">¿A qué días copiar?</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_LABELS.filter((d) => d.value !== sourceDay).map((d) => (
                  <button
                    key={d.value}
                    onClick={() => toggleTarget(d.value)}
                    className={cn(
                      "h-11 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5",
                      targetDays.includes(d.value)
                        ? "gradient-primary text-primary-foreground glow-primary-sm"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {targetDays.includes(d.value) && <Check className="h-4 w-4" />}
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <div className="flex-1" />
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground rounded-xl h-11 px-6 glow-primary-sm"
            disabled={sourceDay === null || targetDays.length === 0}
            onClick={handleCopy}
          >
            <Check className="h-4 w-4 mr-2" />
            Copiar contenido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyToDaysDialog;

import { useState } from "react";
