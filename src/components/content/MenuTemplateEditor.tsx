import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Save, Eye, Layers, LayoutTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FieldSchema {
  key: string;
  label: string;
  type: string;
  placeholder: string;
}

interface MenuTemplate {
  id: string;
  name: string;
  category: string;
  description: string | null;
  thumbnail_url: string | null;
  html_template: string;
  css: string;
  fields_schema: FieldSchema[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  getBusinessId: () => Promise<string | null>;
}

const CATEGORY_LABELS: Record<string, string> = {
  menu: "🍽️ Menús",
  bebidas: "🍹 Bebidas",
  postres: "🍰 Postres",
};

const MenuTemplateEditor = ({ open, onOpenChange, onSaved, getBusinessId }: Props) => {
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MenuTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [contentName, setContentName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTemplates();
      setSelected(null);
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("menu_templates")
      .select("*")
      .order("category")
      .order("name");

    const parsed = (data ?? []).map((t: any) => ({
      ...t,
      fields_schema: Array.isArray(t.fields_schema)
        ? t.fields_schema
        : JSON.parse(t.fields_schema ?? "[]"),
    })) as MenuTemplate[];

    setTemplates(parsed);
    setLoading(false);
  };

  const handleSelect = (tpl: MenuTemplate) => {
    setSelected(tpl);
    setContentName(tpl.name);
    const defaults: Record<string, string> = {};
    tpl.fields_schema.forEach((f) => {
      defaults[f.key] = f.placeholder || "";
    });
    setFieldValues(defaults);
  };

  const renderedHtml = useMemo(() => {
    if (!selected) return "";
    let html = selected.html_template;
    Object.entries(fieldValues).forEach(([key, val]) => {
      html = html.split(`{{${key}}}`).join(val || "");
    });
    return `<!DOCTYPE html><html><head><style>${selected.css}</style></head><body>${html}</body></html>`;
  }, [selected, fieldValues]);

  const handleSave = async () => {
    if (!selected || !contentName.trim()) return;
    setSaving(true);

    const businessId = await getBusinessId();
    if (!businessId) {
      setSaving(false);
      return;
    }

    // Save rendered HTML as a blob to storage
    const blob = new Blob([renderedHtml], { type: "text/html" });
    const filePath = `${businessId}/${crypto.randomUUID()}.html`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, blob, { contentType: "text/html" });

    if (uploadError) {
      toast({ title: "Error al subir", description: uploadError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);

    const { error: dbError } = await supabase.from("content").insert({
      name: contentName.trim(),
      type: "html",
      file_url: urlData.publicUrl,
      business_id: businessId,
    });

    setSaving(false);

    if (dbError) {
      toast({ title: "Error al guardar", description: dbError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Menú creado", description: `"${contentName}" guardado como contenido.` });
    onOpenChange(false);
    onSaved();
  };

  const grouped = useMemo(() => {
    const map: Record<string, MenuTemplate[]> = {};
    templates.forEach((t) => {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    });
    return map;
  }, [templates]);

  // ── Gallery view ──
  if (!selected) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              Plantillas de menú
            </DialogTitle>
            <DialogDescription>Elige una plantilla, personalízala con tus datos y guárdala como contenido.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No hay plantillas disponibles.</p>
          ) : (
            <ScrollArea className="max-h-[55vh] pr-2">
              <div className="space-y-6 py-2">
                {Object.entries(grouped).map(([cat, tpls]) => (
                  <div key={cat}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {tpls.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => handleSelect(tpl)}
                          className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 p-5 text-center transition-all hover:border-primary/40 hover:bg-primary/5"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <Layers className="h-6 w-6 text-muted-foreground group-hover:text-primary-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{tpl.name}</p>
                            {tpl.description && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.description}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Editor view ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated border-border/30 sm:max-w-5xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/30">
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-bold truncate">{selected.name}</h2>
              <p className="text-xs text-muted-foreground">{selected.description}</p>
            </div>
          </div>

          {/* Body: form + preview */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: form */}
            <ScrollArea className="w-[340px] shrink-0 border-r border-border/30 p-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tpl-name">Nombre del contenido *</Label>
                  <Input
                    id="tpl-name"
                    value={contentName}
                    onChange={(e) => setContentName(e.target.value)}
                    placeholder="Mi menú personalizado"
                  />
                </div>

                <div className="border-t border-border/30 pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Personalizar campos
                  </p>
                  {selected.fields_schema.map((field) => (
                    <div key={field.key} className="mb-3">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        value={fieldValues[field.key] ?? ""}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>

            {/* Right: preview */}
            <div className="flex-1 bg-secondary/30 flex items-center justify-center p-4 overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  srcDoc={renderedHtml}
                  className="absolute inset-0 w-full h-full rounded-lg border border-border/30"
                  sandbox="allow-same-origin"
                  title="Vista previa"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !contentName.trim()}
              className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando…" : "Guardar como contenido"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuTemplateEditor;
