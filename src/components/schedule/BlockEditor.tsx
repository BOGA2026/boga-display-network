import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Copy, Trash2, Zap, X } from "lucide-react";
import type { ScheduleBlock, ScheduleLayer } from "@/hooks/useScheduleData";

const DAYS_LABELS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

interface Props {
  block: ScheduleBlock;
  layers: ScheduleLayer[];
  playlists: { id: string; name: string }[];
  onSave: (updated: Partial<ScheduleBlock>) => void;
  onDuplicate: (block: ScheduleBlock) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const BlockEditor = ({ block, layers, playlists, onSave, onDuplicate, onDelete, onClose }: Props) => {
  const [form, setForm] = useState({
    name: block.name,
    playlist_id: block.playlist_id,
    layer_id: block.layer_id,
    start_time: block.start_time.slice(0, 5),
    end_time: block.end_time.slice(0, 5),
    days_of_week: [...block.days_of_week],
    start_date: block.start_date || "",
    end_date: block.end_date || "",
    is_enabled: block.is_enabled,
    recurrence: block.recurrence || "weekly",
  });

  useEffect(() => {
    setForm({
      name: block.name,
      playlist_id: block.playlist_id,
      layer_id: block.layer_id,
      start_time: block.start_time.slice(0, 5),
      end_time: block.end_time.slice(0, 5),
      days_of_week: [...block.days_of_week],
      start_date: block.start_date || "",
      end_date: block.end_date || "",
      is_enabled: block.is_enabled,
      recurrence: block.recurrence || "weekly",
    });
  }, [block]);

  const toggleDay = (d: number) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(d)
        ? f.days_of_week.filter((x) => x !== d)
        : [...f.days_of_week, d],
    }));
  };

  const handleSave = () => {
    onSave({
      id: block.id,
      name: form.name,
      playlist_id: form.playlist_id,
      layer_id: form.layer_id,
      start_time: form.start_time + ":00",
      end_time: form.end_time + ":00",
      days_of_week: form.days_of_week,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_enabled: form.is_enabled,
      recurrence: form.recurrence,
    });
  };

  const layer = layers.find((l) => l.id === form.layer_id);

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-sm font-semibold">Editar bloque</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-xs">Nombre</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="h-8 text-sm bg-secondary border-border"
          />
        </div>

        {/* Playlist */}
        <div className="space-y-1.5">
          <Label className="text-xs">Playlist</Label>
          <Select value={form.playlist_id} onValueChange={(v) => setForm((f) => ({ ...f, playlist_id: v }))}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {playlists.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Layer */}
        <div className="space-y-1.5">
          <Label className="text-xs">Capa / Prioridad</Label>
          <Select value={form.layer_id} onValueChange={(v) => setForm((f) => ({ ...f, layer_id: v }))}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {layers.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                    {l.name} (P{l.priority})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Time */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Inicio</Label>
            <Input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              className="h-8 text-sm bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fin</Label>
            <Input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              className="h-8 text-sm bg-secondary border-border"
            />
          </div>
        </div>

        {/* Days */}
        <div className="space-y-1.5">
          <Label className="text-xs">Días</Label>
          <div className="flex gap-1">
            {DAYS_LABELS.map((d) => (
              <button
                key={d.value}
                onClick={() => toggleDay(d.value)}
                className={`h-7 w-9 rounded text-[10px] font-medium transition-colors ${
                  form.days_of_week.includes(d.value)
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range (optional) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Desde (opcional)</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              className="h-8 text-sm bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hasta (opcional)</Label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              className="h-8 text-sm bg-secondary border-border"
            />
          </div>
        </div>

        {/* Recurrence */}
        <div className="space-y-1.5">
          <Label className="text-xs">Recurrencia</Label>
          <Select value={form.recurrence} onValueChange={(v) => setForm((f) => ({ ...f, recurrence: v }))}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="once">Una vez</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enabled */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Habilitado</Label>
          <Switch
            checked={form.is_enabled}
            onCheckedChange={(v) => setForm((f) => ({ ...f, is_enabled: v }))}
          />
        </div>

        <Separator />

        {/* Triggers placeholder */}
        <div className="rounded-md border border-border/50 bg-secondary/50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            <span className="font-medium">Triggers</span>
            <span className="ml-auto rounded bg-accent/20 px-1.5 py-0.5 text-[9px] text-accent">Próximamente</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/70">
            Clima, hora del día, eventos, POS, activación manual.
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-border p-3 flex gap-2">
        <Button size="sm" className="flex-1 gradient-primary text-primary-foreground" onClick={handleSave}>
          Guardar
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDuplicate(block)}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(block.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default BlockEditor;
