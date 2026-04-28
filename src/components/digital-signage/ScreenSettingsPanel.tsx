import { useState, useCallback, useEffect, useRef } from "react";
import { Camera, RefreshCw, RotateCcw, Trash2, Tag, X, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ScreenData } from "@/data/mockScreens";

interface Props {
  screen: ScreenData;
  onChange: (patch: Partial<ScreenData>) => void;
  onDelete: () => void;
  onSyncComplete?: (data: any) => void;
}

function useDebounce<T>(value: T, ms = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

async function invokeScreenCommand(action: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No autenticado");

  const res = await fetch(
    `https://ovuhtroiuuqsiltqgqpp.supabase.co/functions/v1/screen-commands/${action}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWh0cm9pdXVxc2lsdHFncXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzQ2NjIsImV4cCI6MjA4NjQxMDY2Mn0.qjpz83tFpdxDa8YwbSdQLit4T_IiFV5H6GtEmH1TBNw",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export default function ScreenSettingsPanel({ screen, onChange, onDelete, onSyncComplete }: Props) {
  const [name, setName] = useState(screen.name);
  const debouncedName = useDebounce(name, 800);
  const isFirst = useRef(true);

  const [syncing, setSyncing] = useState(false);
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const [takingScreenshot, setTakingScreenshot] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (debouncedName !== screen.name) {
      onChange({ name: debouncedName });
      toast({ title: "Nombre guardado" });
    }
  }, [debouncedName]);

  const [tagInput, setTagInput] = useState("");
  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase();
    if (t && !screen.tags.includes(t)) onChange({ tags: [...screen.tags, t] });
    setTagInput("");
  }, [tagInput, screen.tags, onChange]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await invokeScreenCommand("sync", { screen_id: screen.id });
      
      // Update local state with sync results
      onChange({
        status: result.status as ScreenData["status"],
        lastSyncAt: result.last_sync_at,
      });

      onSyncComplete?.(result);

      toast({
        title: "Sincronización completada",
        description: `Estado: ${result.status === "online" ? "En línea" : "Desconectada"}${
          result.current_playlist ? ` · Playlist: ${result.current_playlist.name}` : ""
        }`,
      });
    } catch (err: any) {
      toast({
        title: "Error al sincronizar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRecovery = async () => {
    setSendingRecovery(true);
    setRecoveryDialogOpen(false);
    try {
      await invokeScreenCommand("send", {
        screen_id: screen.id,
        command: "RECOVERY_MODE_ON",
        payload: { duration_minutes: 5 },
      });
      toast({
        title: "Modo recuperación activado",
        description: "La pantalla entrará en modo recuperación por 5 minutos.",
      });
    } catch (err: any) {
      toast({
        title: "Error al enviar comando",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSendingRecovery(false);
    }
  };

  const handleScreenshot = async () => {
    setTakingScreenshot(true);
    try {
      await invokeScreenCommand("send", {
        screen_id: screen.id,
        command: "TAKE_SCREENSHOT",
        payload: {},
      });
      toast({
        title: "Captura solicitada",
        description: "El dispositivo tomará una captura en su próximo checkin.",
      });
    } catch (err: any) {
      toast({
        title: "Error al solicitar captura",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setTakingScreenshot(false);
    }
  };

  const anyLoading = syncing || sendingRecovery || takingScreenshot;

  return (
    <aside className="glass-card rounded-xl space-y-5 p-4">
      <h3 className="text-sm font-semibold text-foreground">Ajustes de pantalla</h3>

      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Nombre de pantalla</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
      </fieldset>

      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Volumen – {screen.volume}%</label>
        <Slider value={[screen.volume]} max={100} step={1} onValueChange={([v]) => onChange({ volume: v })} />
      </fieldset>

      <fieldset className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Brillo adaptativo</label>
        <Switch checked={screen.adaptiveBrightness} onCheckedChange={(v) => onChange({ adaptiveBrightness: v })} />
      </fieldset>

      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Brillo – {screen.brightness}%</label>
        <Slider value={[screen.brightness]} max={100} step={1} onValueChange={([v]) => onChange({ brightness: v })} disabled={screen.adaptiveBrightness} />
      </fieldset>

      <fieldset className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Modo reposo</label>
        <Switch checked={screen.sleepMode} onCheckedChange={(v) => onChange({ sleepMode: v })} />
      </fieldset>

      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Zona horaria</label>
        <Select value={screen.timezone} onValueChange={(v) => onChange({ timezone: v })}>
          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="America/Bogota">America/Bogota</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
            <SelectItem value="America/Chicago">America/Chicago</SelectItem>
            <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
            <SelectItem value="Europe/London">Europe/London</SelectItem>
            <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
          </SelectContent>
        </Select>
      </fieldset>

      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Orientación</label>
        <Select value={screen.orientation} onValueChange={(v) => onChange({ orientation: v as "landscape" | "portrait" })}>
          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="landscape">Horizontal</SelectItem>
            <SelectItem value="portrait">Vertical</SelectItem>
          </SelectContent>
        </Select>
      </fieldset>

      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Modo de visualización</label>
        <Select value={screen.displayMode} onValueChange={(v) => onChange({ displayMode: v as "fill" | "fit" | "stretch" })}>
          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fill">Rellenar</SelectItem>
            <SelectItem value="fit">Ajustar</SelectItem>
            <SelectItem value="stretch">Estirar</SelectItem>
          </SelectContent>
        </Select>
      </fieldset>

      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Rotación de video</label>
        <Select
          value={String(screen.rotation ?? 0)}
          onValueChange={(v) => onChange({ rotation: Number(v) as 0 | 90 | 180 | 270 })}
        >
          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0° (Normal)</SelectItem>
            <SelectItem value="90">90° (Derecha)</SelectItem>
            <SelectItem value="180">180° (Invertido)</SelectItem>
            <SelectItem value="270">270° (Izquierda)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          Rota el contenido en pantalla. Útil para TV instaladas en vertical.
        </p>
      </fieldset>

      <fieldset className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Reinicio automático</label>
        <Switch checked={screen.autoReboot} onCheckedChange={(v) => onChange({ autoReboot: v })} />
      </fieldset>

      <fieldset className="space-y-1.5">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <Tag className="h-3 w-3" /> Etiquetas
        </label>
        <div className="flex flex-wrap gap-1.5">
          {screen.tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 text-xs">
              {t}
              <button onClick={() => onChange({ tags: screen.tags.filter((x) => x !== t) })} aria-label={`Eliminar etiqueta ${t}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="Agregar etiqueta…" className="h-8 bg-secondary border-border text-xs" />
          <Button variant="outline" size="sm" onClick={addTag} className="h-8">Agregar</Button>
        </div>
      </fieldset>

      <div className="space-y-2 pt-2 border-t border-border">
        {/* Screenshot */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          disabled={anyLoading}
          onClick={handleScreenshot}
        >
          {takingScreenshot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {takingScreenshot ? "Solicitando captura…" : "Captura de pantalla"}
        </Button>

        {/* Sync */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          disabled={anyLoading}
          onClick={handleSync}
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncing ? "Sincronizando…" : "Sincronizar datos"}
        </Button>

        {/* Recovery */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          disabled={anyLoading}
          onClick={() => setRecoveryDialogOpen(true)}
        >
          {sendingRecovery ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          {sendingRecovery ? "Enviando comando…" : "Pantalla de recuperación"}
        </Button>

        {/* Recovery confirmation dialog */}
        <Dialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
          <DialogContent className="surface-elevated border-border/30 sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-lg">¿Activar modo recuperación?</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                La pantalla <strong className="text-foreground">{screen.name}</strong> entrará en modo recuperación durante 5 minutos. El contenido actual se pausará.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setRecoveryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-amber-600 text-white hover:bg-amber-700"
                onClick={handleRecovery}
              >
                Activar recuperación
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full justify-start gap-2" disabled={anyLoading}>
              <Trash2 className="h-4 w-4" /> Eliminar pantalla
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar pantalla?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará permanentemente <strong>{screen.name}</strong> y todos sus datos de programación. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}
