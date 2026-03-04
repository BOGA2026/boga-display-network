import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ListMusic, Globe, FileText, AlertOctagon, ChevronRight, ChevronLeft, Save, Upload } from "lucide-react";
import type { ScheduleLayer } from "@/hooks/useScheduleData";

const DAYS_LABELS = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "Mi" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

const CONTENT_TYPES = [
  { id: "playlist", label: "Playlist", icon: ListMusic, desc: "Contenido existente" },
  { id: "url", label: "URL remota", icon: Globe, desc: "Página web externa" },
  { id: "template", label: "Plantilla", icon: FileText, desc: "Plantilla de menú" },
  { id: "emergency", label: "Emergencia", icon: AlertOctagon, desc: "Aviso de emergencia" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  layers: ScheduleLayer[];
  playlists: { id: string; name: string }[];
  onCreateBlock: (data: {
    name: string;
    playlist_id: string;
    layer_id: string;
    start_time: string;
    end_time: string;
    days_of_week: number[];
    recurrence: string;
  }) => void;
}

const NewBlockWizard = ({ open, onOpenChange, layers, playlists, onCreateBlock }: Props) => {
  const [step, setStep] = useState(0);
  const [contentType, setContentType] = useState("playlist");
  const [name, setName] = useState("");
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id || "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [recurrence, setRecurrence] = useState("weekly");
  const [layerId, setLayerId] = useState(layers[0]?.id || "");

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleCreate = (publish: boolean) => {
    onCreateBlock({
      name: name || CONTENT_TYPES.find((c) => c.id === contentType)?.label || "Nuevo bloque",
      playlist_id: playlistId,
      layer_id: layerId,
      start_time: startTime + ":00",
      end_time: endTime + ":00",
      days_of_week: days,
      recurrence,
    });
    onOpenChange(false);
    // Reset
    setStep(0);
    setName("");
  };

  const steps = ["Contenido", "Horario", "Destino"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Nuevo bloque</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors",
                  i <= step
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              <span className={cn("text-xs", i <= step ? "text-foreground" : "text-muted-foreground")}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <div className={cn("h-px w-6", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Content */}
        {step === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setContentType(ct.id)}
                  className={cn(
                    "rounded-lg p-3 text-left border transition-all",
                    contentType === ct.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
                  )}
                >
                  <ct.icon className="h-5 w-5 mb-1.5 text-muted-foreground" />
                  <div className="text-xs font-medium">{ct.label}</div>
                  <div className="text-[10px] text-muted-foreground">{ct.desc}</div>
                </button>
              ))}
            </div>

            {contentType === "playlist" && playlists.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Playlist</Label>
                <Select value={playlistId} onValueChange={setPlaylistId}>
                  <SelectTrigger className="h-8 text-sm bg-secondary/40 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {playlists.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Nombre (opcional)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Menú almuerzo"
                className="h-8 text-sm bg-secondary/40 border-border/50"
              />
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Hora inicio</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-8 text-sm bg-secondary/40 border-border/50 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Hora fin</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-8 text-sm bg-secondary/40 border-border/50 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Días</Label>
              <div className="flex gap-1.5">
                {DAYS_LABELS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "h-9 w-9 rounded-lg text-xs font-semibold transition-all",
                      days.includes(d.value)
                        ? "gradient-primary text-primary-foreground glow-primary-sm"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Repetición</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger className="h-8 text-sm bg-secondary/40 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="once">Una vez</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Priority & destination */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Capa / Prioridad</Label>
              <div className="space-y-1.5">
                {layers.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayerId(l.id)}
                    className={cn(
                      "w-full rounded-lg p-3 text-left border transition-all flex items-center gap-3",
                      layerId === l.id
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
                    )}
                  >
                    <span className="h-4 w-4 rounded-md" style={{ background: l.color }} />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{l.name}</div>
                      <div className="text-[10px] text-muted-foreground">Prioridad {l.priority}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-2 pt-2">
          {step > 0 && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
              Atrás
            </Button>
          )}
          <div className="flex-1" />
          {step < 2 ? (
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1" onClick={() => setStep(step + 1)}>
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => handleCreate(false)}>
                <Save className="h-3.5 w-3.5" />
                Guardar borrador
              </Button>
              <Button size="sm" className="gradient-primary text-primary-foreground gap-1" onClick={() => handleCreate(true)}>
                <Upload className="h-3.5 w-3.5" />
                Guardar y publicar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewBlockWizard;
