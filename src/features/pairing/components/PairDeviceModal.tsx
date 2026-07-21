import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, MonitorSmartphone } from "lucide-react";
import { CodeInput } from "./CodeInput";
import { usePairDevice, pairErrorMessage } from "../hooks/usePairDevice";

interface PairDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaired?: (result: { device_id: string; screen_id: string }) => void;
}

export function PairDeviceModal({ open, onOpenChange, onPaired }: PairDeviceModalProps) {
  const [code, setCode] = useState("");
  const [screenName, setScreenName] = useState("");
  const [phase, setPhase] = useState<"input" | "success">("input");
  const { claim, loading, error, reset } = usePairDevice();

  useEffect(() => {
    if (!open) {
      // Reset on close
      setTimeout(() => {
        setCode("");
        setScreenName("");
        setPhase("input");
        reset();
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-submit when 6 digits typed and no error
  useEffect(() => {
    if (code.length === 6 && !loading && phase === "input") {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const submit = async () => {
    if (code.length !== 6) return;
    const res = await claim(code, screenName || undefined);
    if (res) {
      setPhase("success");
      onPaired?.({ device_id: res.device_id, screen_id: res.screen_id });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
        {phase === "input" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
                Emparejar una pantalla
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Escribe el código de 6 dígitos que aparece en tu TV.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <CodeInput
                value={code}
                onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                error={!!error}
                autoFocus
              />

              <div className="space-y-1.5">
                <Label htmlFor="pair-screen-name" className="text-xs font-medium text-muted-foreground">
                  Nombre para esta pantalla (opcional)
                </Label>
                <Input
                  id="pair-screen-name"
                  placeholder="Ej: Caja principal"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  maxLength={40}
                  disabled={loading}
                />
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verificando código…</span>
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive text-center">
                  {pairErrorMessage(error)}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submit}
                disabled={code.length !== 6 || loading}
                className="flex-1 gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Emparejar
              </Button>
            </div>
          </>
        ) : (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
              <CheckCircle2 className="relative h-16 w-16 text-primary animate-in zoom-in duration-500" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">¡Pantalla conectada!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ya puedes enviarle contenido desde el panel.
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity"
            >
              Listo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
