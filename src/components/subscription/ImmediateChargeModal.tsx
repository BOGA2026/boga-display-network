import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, Shield } from "lucide-react";
import { fmtCOP, fmtDate, nextBillingDate } from "@/lib/proration";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  immediateCharge: number;
  nextCycleTotal: number;
  newScreenCount: number;
  billingAnchor: Date;
  saving: boolean;
  onConfirm: () => void;
}

export function ImmediateChargeModal({
  open, onOpenChange, immediateCharge, nextCycleTotal, newScreenCount, billingAnchor, saving, onConfirm,
}: Props) {
  const nextDate = nextBillingDate(billingAnchor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Confirmar cambio
          </DialogTitle>
          <DialogDescription>
            Revisa los detalles antes de confirmar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {immediateCharge > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-primary" />
                Cobro inmediato
              </div>
              <p className="font-display text-2xl font-bold text-gradient-primary">{fmtCOP(immediateCharge)}</p>
              <p className="text-xs text-muted-foreground">Prorrateo por los días restantes del ciclo actual</p>
            </div>
          )}

          <div className="rounded-xl border border-border/30 bg-secondary/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Próximo cobro
            </div>
            <p className="font-display text-xl font-bold">{fmtCOP(nextCycleTotal)} /mes</p>
            <p className="text-xs text-muted-foreground">
              {newScreenCount} pantallas · A partir del {fmtDate(nextDate)}
            </p>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            <p>Tu tarjeta será cargada de forma segura. Puedes cancelar o modificar en cualquier momento.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={onConfirm}
            disabled={saving}
            className="gradient-primary hover:opacity-90 glow-primary-sm text-primary-foreground border-0 gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {saving ? "Procesando..." : immediateCharge > 0 ? `Pagar ${fmtCOP(immediateCharge)}` : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
