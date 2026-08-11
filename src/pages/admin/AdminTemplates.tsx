import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/feedback/states";
import { LayoutTemplate, Plus, Pencil } from "lucide-react";
import { listTemplates, setTemplateActive, uploadTemplateAsset } from "@/features/templates/api";
import {
  BUSINESS_TYPES,
  ORIENTATIONS,
  PIECE_TYPES,
  labelOf,
  type TemplateOrientation,
} from "@/features/templates/types";

/**
 * Panel interno: el equipo de Visualia sube el fondo ya diseñado y luego marca
 * encima, en el editor, qué capas puede cambiar el cliente.
 */
export default function AdminTemplates() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    business_type: string;
    piece_type: string;
    orientation: TemplateOrientation;
    file: File | null;
  }>({
    name: "",
    business_type: "restaurante",
    piece_type: "menu",
    orientation: "horizontal",
    file: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plantillas"],
    queryFn: () => listTemplates({ soloActivas: false }),
  });

  const crear = async () => {
    if (!form.file || !form.name.trim()) return;
    setSubiendo(true);
    try {
      const url = await uploadTemplateAsset(form.file, form.file.name.replace(/[^\w.-]/g, "_"));
      const q = new URLSearchParams({
        templateBg: url,
        orientation: form.orientation,
        templateName: form.name.trim(),
        templateBusiness: form.business_type,
        templatePiece: form.piece_type,
      });
      setAbierto(false);
      navigate(`/dashboard/editor?${q.toString()}`);
    } catch (e: any) {
      toast.error("No pudimos subir el fondo: " + (e?.message ?? ""));
    } finally {
      setSubiendo(false);
    }
  };

  const alternar = async (id: string, activa: boolean) => {
    try {
      await setTemplateActive(id, activa);
      qc.invalidateQueries({ queryKey: ["admin-plantillas"] });
      qc.invalidateQueries({ queryKey: ["plantillas"] });
    } catch (e: any) {
      toast.error("No pudimos cambiar el estado: " + (e?.message ?? ""));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Plantillas</h1>
          <p className="text-sm text-muted-foreground">
            Fondos diseñados por Visualia con capas editables para el cliente.
          </p>
        </div>
        <Button onClick={() => setAbierto(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva plantilla
        </Button>
      </div>

      {isLoading ? (
        <div className="v-media-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-lg" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<LayoutTemplate />}
          title="Todavía no hay plantillas"
          description="Subí un fondo y marcá encima qué puede cambiar el cliente."
        />
      ) : (
        <div className="v-media-grid">
          {data.map((t) => (
            <div key={t.id} className="v-card overflow-hidden p-0">
              <img
                src={t.thumbnail_url || t.background_url}
                alt={t.name}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-semibold">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {labelOf(BUSINESS_TYPES, t.business_type)} · {labelOf(PIECE_TYPES, t.piece_type)} ·{" "}
                  {labelOf(ORIENTATIONS, t.orientation)}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={t.is_active} onCheckedChange={(v) => alternar(t.id, v)} />
                    {t.is_active ? "Visible" : "Oculta"}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => navigate(`/dashboard/editor?template=${t.id}&edit=1`)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva plantilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nombre</label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Menú del día — fondo madera"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Negocio</label>
                <select
                  value={form.business_type}
                  onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                >
                  {BUSINESS_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Pieza</label>
                <select
                  value={form.piece_type}
                  onChange={(e) => setForm({ ...form, piece_type: e.target.value })}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                >
                  {PIECE_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Orientación</label>
              <select
                value={form.orientation}
                onChange={(e) => setForm({ ...form, orientation: e.target.value as TemplateOrientation })}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                {ORIENTATIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Fondo ({form.orientation === "vertical" ? "1080 × 1920" : "1920 × 1080"})
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
                className="w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:text-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button onClick={crear} disabled={subiendo || !form.file || !form.name.trim()}>
              {subiendo ? "Subiendo…" : "Abrir en el editor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
