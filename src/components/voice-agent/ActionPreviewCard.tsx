import { Check, X, AlertTriangle } from "lucide-react";
import type { PendingAction } from "@/hooks/useVoiceAgent";

interface Props {
  action: PendingAction;
  onConfirm: () => void;
  onReject: () => void;
}

/**
 * Tarjeta de confirmación visual antes de ejecutar una acción destructiva.
 * El dueño debe confirmar con un tap (o decir "sí" en voz, futuro).
 */
export const ActionPreviewCard = ({ action, onConfirm, onReject }: Props) => {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 my-2 animate-in slide-in-from-bottom-2">
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-xs text-amber-500 font-semibold mb-0.5">Confirmá el cambio</div>
          <div className="text-sm text-foreground">{action.description}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 h-8 rounded-md bg-green-500 hover:bg-green-600 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <Check className="h-3.5 w-3.5" /> Sí, aplicá
        </button>
        <button
          onClick={onReject}
          className="flex-1 h-8 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
      </div>
    </div>
  );
};
