import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, MonitorSmartphone, Tv, Wifi, Maximize2 } from "lucide-react";
import { CodeInput, normalizePairingCode } from "./CodeInput";
import { usePairDevice, pairErrorMessage, type PairedDeviceInfo } from "../hooks/usePairDevice";

export interface PairLocationOption {
  id: string;
  name: string;
}

interface PairDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaired?: (result: { device_id: string; screen_id: string }) => void;
  /** Sedes del negocio para elegir dónde queda la pantalla. */
  locations?: PairLocationOption[];
  /** Zona horaria por defecto del negocio. */
  defaultTimezone?: string;
}

const TIMEZONES = [
  { value: "America/Bogota", label: "Bogotá (GMT-05:00)" },
  { value: "America/Lima", label: "Lima (GMT-05:00)" },
  { value: "America/Guayaquil", label: "Guayaquil (GMT-05:00)" },
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-06:00)" },
  { value: "America/Caracas", label: "Caracas (GMT-04:00)" },
  { value: "America/La_Paz", label: "La Paz (GMT-04:00)" },
  { value: "America/Santiago", label: "Santiago (GMT-03:00)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-03:00)" },
  { value: "America/Montevideo", label: "Montevideo (GMT-03:00)" },
  { value: "America/New_York", label: "Nueva York (GMT-05:00)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (GMT-08:00)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+01:00)" },
];

/**
 * Vincular pantalla.
 *
 * El flujo real: el código lo genera y lo muestra el reproductor en el televisor,
 * el usuario lo escribe acá. Por eso el campo del código va primero; el nombre,
 * la sede y la zona horaria vienen después, cuando ya sabemos qué equipo es.
 */
export function PairDeviceModal({
  open,
  onOpenChange,
  onPaired,
  locations = [],
  defaultTimezone = "America/Bogota",
}: PairDeviceModalProps) {
  const [code, setCode] = useState("");
  const [device, setDevice] = useState<PairedDeviceInfo | null>(null);
  const [screenName, setScreenName] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [phase, setPhase] = useState<"code" | "details" | "success">("code");
  const { lookup, claim, loading, error, reset } = usePairDevice();

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setCode("");
        setDevice(null);
        setScreenName("");
        setLocationId("");
        setTimezone(defaultTimezone);
        setPhase("code");
        reset();
      }, 200);
      return () => clearTimeout(t);
    }
    setLocationId(locations[0]?.id ?? "");
    setTimezone(defaultTimezone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const verifyCode = async () => {
    if (code.length !== 6 || loading) return;
    const info = await lookup(code);
    if (info) {
      setDevice(info);
      setPhase("details");
    }
  };

  const confirmPair = async () => {
    if (loading) return;
    const res = await claim(code, {
      screenName: screenName.trim() || undefined,
      locationId: locationId || undefined,
      timezone,
    });
    if (res) {
      setPhase("success");
      onPaired?.({ device_id: res.device_id, screen_id: res.screen_id });
    } else {
      // El código pudo vencer entre la verificación y la confirmación.
      setPhase("code");
    }
  };

  const errorBox = error ? (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive"
    >
      {pairErrorMessage(error)}
    </div>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
        {phase === "code" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
                Vincular pantalla
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Abrí la app de Visualia en tu televisor. Vas a ver un código de 6 caracteres en
                pantalla. Escribilo acá abajo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <CodeInput
                value={code}
                onChange={(v) => setCode(normalizePairingCode(v))}
                disabled={loading}
                error={!!error}
                autoFocus
              />
              <p className="text-center text-xs text-muted-foreground">
                Da igual si lo escribís con guion o sin guion, en mayúsculas o minúsculas.
              </p>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Buscando el televisor…</span>
                </div>
              )}
              {errorBox}
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={verifyCode}
                disabled={code.length !== 6 || loading}
                className="flex-1 gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Vincular
              </Button>
            </div>
          </>
        )}

        {phase === "details" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
                Encontramos tu televisor
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Confirmá que es el equipo correcto y ponele nombre.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Qué equipo encontramos */}
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Tv className="h-4 w-4 text-primary" aria-hidden="true" />
                  {device?.device_model || "Televisor sin modelo reportado"}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {device?.resolution || "Resolución no reportada"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                    {device?.network_type || "Red no reportada"}
                  </span>
                  <span className="font-mono">Código {code}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pair-screen-name" className="text-sm font-medium">
                  Nombre de la pantalla
                </Label>
                <Input
                  id="pair-screen-name"
                  placeholder="Ejemplo: Caja principal"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  maxLength={40}
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Así la reconocés después en el panel.
                </p>
              </div>

              {locations.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Sede</Label>
                  <Select value={locationId} onValueChange={setLocationId} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elegí la sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Zona horaria</Label>
                <Select value={timezone} onValueChange={setTimezone} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Con esto la programación por horarios cae a la hora del local.
                </p>
              </div>

              {errorBox}
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="ghost"
                className="flex-1"
                disabled={loading}
                onClick={() => {
                  setPhase("code");
                  reset();
                }}
              >
                Volver
              </Button>
              <Button
                onClick={confirmPair}
                disabled={loading}
                className="flex-1 gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Vinculando…
                  </span>
                ) : (
                  "Vincular"
                )}
              </Button>
            </div>
          </>
        )}

        {phase === "success" && (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
              <CheckCircle2 className="relative h-16 w-16 text-primary animate-in zoom-in duration-500" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">¡Pantalla vinculada!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ya podés enviarle contenido desde el panel.
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
