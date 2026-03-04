import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Image, Film, FileText, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

const CONTENT_TYPES = [
  { id: "playlist", label: "Imagen o video", icon: Image, desc: "Muestra fotos o videos en tu pantalla", color: "hsl(270 100% 50%)" },
  { id: "video", label: "Video promocional", icon: Film, desc: "Reproduce un video con sonido", color: "hsl(200 100% 50%)" },
  { id: "template", label: "Menú o cartelera", icon: FileText, desc: "Usa una plantilla prediseñada", color: "hsl(30 100% 50%)" },
];

const DAYS_LABELS = [
  { value: 1, label: "Lunes", short: "L" },
  { value: 2, label: "Martes", short: "M" },
  { value: 3, label: "Miércoles", short: "Mi" },
  { value: 4, label: "Jueves", short: "J" },
  { value: 5, label: "Viernes", short: "V" },
  { value: 6, label: "Sábado", short: "S" },
  { value: 0, label: "Domingo", short: "D" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  playlists: { id: string; name: string }[];
  defaultLayerId: string;
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

const AddContentWizard = ({ open, onOpenChange, playlists, defaultLayerId, onCreateBlock }: Props) => {
  const [step, setStep] = useState(0);
  const [contentType, setContentType] = useState("playlist");
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id || "");
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [days, setDays] = useState([1, 2, 3, 4, 5, 6, 0]);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const selectWeekdays = () => setDays([1, 2, 3, 4, 5]);
  const selectAll = () => setDays([1, 2, 3, 4, 5, 6, 0]);
  const selectWeekend = () => setDays([6, 0]);

  const handleCreate = () => {
    if (!playlistId) {
      return;
    }
    onCreateBlock({
      name: name || CONTENT_TYPES.find((c) => c.id === contentType)?.label || "Nuevo contenido",
      playlist_id: playlistId,
      layer_id: defaultLayerId,
      start_time: startTime + ":00",
      end_time: endTime + ":00",
      days_of_week: days,
      recurrence: "weekly",
    });
    onOpenChange(false);
    setStep(0);
    setName("");
  };

  const stepTitles = ["¿Qué quieres mostrar?", "¿Cuándo se muestra?", "Todo listo"];

  const reset = () => {
    setStep(0);
    setContentType("playlist");
    setName("");
    setStartTime("09:00");
    setEndTime("17:00");
    setDays([1, 2, 3, 4, 5, 6, 0]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="bg-card border-border/50 max-w-lg rounded-2xl p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-secondary">
          <div
            className="h-full gradient-primary rounded-r-full transition-all duration-500"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-xl">
              {stepTitles[step]}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {step === 0 && "Elige el tipo de contenido que aparecerá en tu pantalla."}
              {step === 1 && "Selecciona los días y el horario de reproducción."}
              {step === 2 && "Revisa los datos y confirma para programar."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Content type */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid gap-3">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => setContentType(ct.id)}
                    className={cn(
                      "rounded-2xl p-5 text-left border-2 transition-all flex items-center gap-4",
                      contentType === ct.id
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:border-border"
                    )}
                  >
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${ct.color}20` }}
                    >
                      <ct.icon className="h-6 w-6" style={{ color: ct.color }} />
                    </div>
                    <div>
                      <div className="text-base font-semibold">{ct.label}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{ct.desc}</div>
                    </div>
                    {contentType === ct.id && (
                      <Check className="h-5 w-5 text-primary ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {playlists.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Elige playlist</Label>
                  <Select value={playlistId} onValueChange={setPlaylistId}>
                    <SelectTrigger className="h-12 text-base rounded-xl bg-secondary/40 border-border/50">
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-base py-3">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Dale un nombre <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Promoción de verano"
                  className="h-12 text-base rounded-xl bg-secondary/40 border-border/50"
                />
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Days */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">¿Qué días se muestra?</Label>
                <div className="flex gap-2">
                  {DAYS_LABELS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => toggleDay(d.value)}
                      className={cn(
                        "h-12 flex-1 rounded-xl text-sm font-semibold transition-all",
                        days.includes(d.value)
                          ? "gradient-primary text-primary-foreground glow-primary-sm shadow-md"
                          : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={selectAll}>
                    Todos los días
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={selectWeekdays}>
                    Lunes a viernes
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={selectWeekend}>
                    Fin de semana
                  </Button>
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hora de inicio</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-12 text-lg font-mono rounded-xl bg-secondary/40 border-border/50 text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hora de fin</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-12 text-lg font-mono rounded-xl bg-secondary/40 border-border/50 text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-secondary/30 border border-border/40 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-base font-semibold">Resumen</span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Contenido</span>
                    <span className="font-medium">{name || CONTENT_TYPES.find(c => c.id === contentType)?.label}</span>
                  </div>
                  {contentType === "playlist" && (
                    <div className="flex justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Playlist</span>
                      <span className="font-medium">{playlists.find(p => p.id === playlistId)?.name || "—"}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Horario</span>
                    <span className="font-medium font-mono">{startTime} – {endTime}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Días</span>
                    <span className="font-medium">
                      {days.length === 7
                        ? "Todos los días"
                        : days.length === 5 && !days.includes(6) && !days.includes(0)
                        ? "Lunes a viernes"
                        : DAYS_LABELS.filter(d => days.includes(d.value)).map(d => d.short).join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl gap-2 text-sm h-12"
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Atrás
              </Button>
            )}
            <div className="flex-1" />
            {step < 2 ? (
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground rounded-xl gap-2 text-sm h-12 px-8 glow-primary-sm"
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !playlistId}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground rounded-xl gap-2 text-base h-12 px-8 glow-primary"
                onClick={handleCreate}
              >
                <Check className="h-5 w-5" />
                Confirmar y guardar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddContentWizard;
