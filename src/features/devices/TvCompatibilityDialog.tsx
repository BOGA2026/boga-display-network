import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TvCompatibilityWizard } from "./TvCompatibilityWizard";
import { COPY } from "@/config/lexicon";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Consulta suelta: "¿Mi televisor sirve?" fuera del alta de pantallas. */
export function TvCompatibilityDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated max-h-[85vh] overflow-y-auto border-border/30 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{COPY.dispositivo.consultaTitulo}</DialogTitle>
        </DialogHeader>
        <TvCompatibilityWizard consultOnly onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
