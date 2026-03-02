import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, X, Plus, Trash2, Palette, LayoutGrid, Download, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
type MenuItem = {
  name: string;
  desc: string;
  price: string;
  image: string;
};

type Category = {
  title: string;
  items: MenuItem[];
};

type MenuConfig = {
  brand: string;
  subtitle: string;
  heroImage: string;
  footerLeft: string;
  footerBadge: string;
  theme: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    accent: string;
  };
  layout: { columns: 2 | 3 };
  categories: Category[];
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  getBusinessId: () => Promise<string | null>;
}

const DEFAULT_CONFIG: MenuConfig = {
  brand: "Bistro Central",
  subtitle: "Carta del Día",
  heroImage:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80",
  footerLeft: "Lunes a Domingo 7:00 AM - 10:00 PM",
  footerBadge: "WiFi + Delivery",
  theme: {
    bg: "#f7f8fa",
    surface: "#ffffff",
    text: "#1f2937",
    muted: "#6b7280",
    primary: "#0f766e",
    accent: "#f59e0b",
  },
  layout: { columns: 2 },
  categories: [
    {
      title: "Desayunos",
      items: [
        { name: "Omelette Especial", desc: "Queso, espinaca y pan artesanal", price: "$8.90", image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=300&q=80" },
        { name: "Waffles Frutales", desc: "Frutos rojos y miel de maple", price: "$7.50", image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=300&q=80" },
      ],
    },
    {
      title: "Almuerzos",
      items: [
        { name: "Pollo Grill", desc: "Con vegetales salteados", price: "$12.90", image: "https://images.unsplash.com/photo-1604908554165-162f7b0f2eb8?auto=format&fit=crop&w=300&q=80" },
        { name: "Pasta Alfredo", desc: "Salsa cremosa y parmesano", price: "$11.40", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=300&q=80" },
      ],
    },
    {
      title: "Bebidas",
      items: [
        { name: "Limonada Fresh", desc: "Hierbabuena y limón", price: "$3.50", image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=300&q=80" },
        { name: "Café Latte", desc: "Doble espresso y leche vaporizada", price: "$4.20", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80" },
      ],
    },
  ],
};

/* ── Render full HTML for the menu ── */
function renderMenuHtml(config: MenuConfig): string {
  const colsClass = config.layout.columns === 3 ? "grid-template-columns:repeat(3,1fr)" : "grid-template-columns:repeat(2,1fr)";
  const cats = config.categories
    .map(
      (cat) => `
      <article style="background:${config.theme.surface};border-left:8px solid ${config.theme.primary};border-radius:12px;padding:16px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
        <h3 style="color:${config.theme.primary};font-size:28px;font-weight:800;margin:0 0 8px">${cat.title}</h3>
        ${cat.items
          .map(
            (it) => `
          <div style="display:grid;grid-template-columns:78px 1fr auto;align-items:center;gap:12px;padding:8px 0;border-bottom:1px dashed #ddd">
            <img src="${it.image}" alt="${it.name}" style="width:78px;height:78px;object-fit:cover;border-radius:8px"/>
            <div>
              <p style="margin:0;font-size:22px;font-weight:700;color:${config.theme.text}">${it.name}</p>
              <p style="margin:2px 0 0;font-size:15px;color:${config.theme.muted}">${it.desc}</p>
            </div>
            <div style="min-width:110px;text-align:right;font-size:26px;font-weight:900;color:${config.theme.accent}">${it.price}</div>
          </div>`
          )
          .join("")}
      </article>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:${config.theme.bg}}
</style></head><body>
<div style="width:1920px;height:1080px;display:grid;grid-template-rows:260px 1fr 70px;overflow:hidden;border-radius:16px">
  <header style="position:relative;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;background:url('${config.heroImage}') center/cover;padding:40px 56px;color:#fff">
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.25),rgba(0,0,0,.65))"></div>
    <h1 style="position:relative;z-index:1;font-size:48px;font-weight:800">${config.brand}</h1>
    <p style="position:relative;z-index:1;font-size:24px">${config.subtitle}</p>
  </header>
  <section style="display:grid;${colsClass};gap:20px;padding:28px;align-content:start">
    ${cats}
  </section>
  <footer style="display:flex;align-items:center;justify-content:space-between;background:#0f172a;padding:0 32px;font-size:20px;font-weight:600;color:#f1f5f9">
    <div>${config.footerLeft}</div>
    <div style="background:${config.theme.accent};color:#1e293b;border-radius:999px;padding:8px 12px;font-size:16px;font-weight:800">${config.footerBadge}</div>
  </footer>
</div>
</body></html>`;
}

/* ── Tabs ── */
type EditorTab = "general" | "categories" | "theme" | "json";

const MenuTemplateEditor = ({ open, onOpenChange, onSaved, getBusinessId }: Props) => {
  const [config, setConfig] = useState<MenuConfig>(DEFAULT_CONFIG);
  const [rawJson, setRawJson] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
  const [contentName, setContentName] = useState("Mi menú digital");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<EditorTab>("general");
  const { toast } = useToast();

  const renderedHtml = useMemo(() => renderMenuHtml(config), [config]);

  const updateConfig = useCallback((next: MenuConfig) => {
    setConfig(next);
    setRawJson(JSON.stringify(next, null, 2));
  }, []);

  const applyJson = () => {
    try {
      const parsed = JSON.parse(rawJson) as MenuConfig;
      setConfig(parsed);
    } catch {
      toast({ title: "JSON inválido", description: "Revisa el formato del JSON.", variant: "destructive" });
    }
  };

  const addCategory = () => {
    updateConfig({
      ...config,
      categories: [...config.categories, { title: "Nueva Categoría", items: [{ name: "Producto", desc: "Descripción", price: "$0.00", image: "" }] }],
    });
  };

  const removeCategory = (idx: number) => {
    const next = { ...config, categories: config.categories.filter((_, i) => i !== idx) };
    updateConfig(next);
  };

  const updateCategory = (idx: number, partial: Partial<Category>) => {
    const cats = [...config.categories];
    cats[idx] = { ...cats[idx], ...partial };
    updateConfig({ ...config, categories: cats });
  };

  const addItem = (catIdx: number) => {
    const cats = [...config.categories];
    cats[catIdx] = { ...cats[catIdx], items: [...cats[catIdx].items, { name: "Nuevo", desc: "", price: "$0.00", image: "" }] };
    updateConfig({ ...config, categories: cats });
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    const cats = [...config.categories];
    cats[catIdx] = { ...cats[catIdx], items: cats[catIdx].items.filter((_, i) => i !== itemIdx) };
    updateConfig({ ...config, categories: cats });
  };

  const updateItem = (catIdx: number, itemIdx: number, partial: Partial<MenuItem>) => {
    const cats = [...config.categories];
    const items = [...cats[catIdx].items];
    items[itemIdx] = { ...items[itemIdx], ...partial };
    cats[catIdx] = { ...cats[catIdx], items };
    updateConfig({ ...config, categories: cats });
  };

  const handleSave = async () => {
    if (!contentName.trim()) return;
    setSaving(true);
    const businessId = await getBusinessId();
    if (!businessId) { setSaving(false); return; }

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

  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Type className="h-3.5 w-3.5" /> },
    { id: "categories", label: "Categorías", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { id: "theme", label: "Tema", icon: <Palette className="h-3.5 w-3.5" /> },
    { id: "json", label: "JSON", icon: <Download className="h-3.5 w-3.5" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-elevated border-border/30 p-0 sm:max-w-[95vw] max-h-[95vh] w-[95vw] h-[90vh]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-base font-bold">Editor de Menú Digital</h2>
              <p className="text-xs text-muted-foreground">Diseña tu menú visualmente y guárdalo como contenido</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar */}
            <div className="w-[360px] shrink-0 border-r border-border/30 flex flex-col bg-secondary/20">
              {/* Tabs */}
              <div className="flex border-b border-border/30">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors ${
                      tab === t.id ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <ScrollArea className="flex-1 p-4">
                {/* General tab */}
                {tab === "general" && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Nombre del contenido *</Label>
                      <Input value={contentName} onChange={(e) => setContentName(e.target.value)} placeholder="Mi menú digital" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Nombre del negocio</Label>
                      <Input value={config.brand} onChange={(e) => updateConfig({ ...config, brand: e.target.value })} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Subtítulo</Label>
                      <Input value={config.subtitle} onChange={(e) => updateConfig({ ...config, subtitle: e.target.value })} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Imagen de portada (URL)</Label>
                      <Input value={config.heroImage} onChange={(e) => updateConfig({ ...config, heroImage: e.target.value })} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Pie izquierdo (horario)</Label>
                      <Input value={config.footerLeft} onChange={(e) => updateConfig({ ...config, footerLeft: e.target.value })} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Insignia del pie</Label>
                      <Input value={config.footerBadge} onChange={(e) => updateConfig({ ...config, footerBadge: e.target.value })} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Columnas</Label>
                      <select
                        value={config.layout.columns}
                        onChange={(e) => updateConfig({ ...config, layout: { columns: Number(e.target.value) as 2 | 3 } })}
                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      >
                        <option value={2}>2 columnas</option>
                        <option value={3}>3 columnas</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Categories tab */}
                {tab === "categories" && (
                  <div className="space-y-4">
                    {config.categories.map((cat, ci) => (
                      <div key={ci} className="rounded-lg border border-border/50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={cat.title}
                            onChange={(e) => updateCategory(ci, { title: e.target.value })}
                            className="h-7 text-sm font-semibold flex-1"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeCategory(ci)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {cat.items.map((item, ii) => (
                          <div key={ii} className="rounded-md border border-border/30 p-2 space-y-1.5 bg-background/50">
                            <div className="flex items-center gap-1">
                              <Input value={item.name} onChange={(e) => updateItem(ci, ii, { name: e.target.value })} className="h-6 text-xs flex-1" placeholder="Nombre" />
                              <Input value={item.price} onChange={(e) => updateItem(ci, ii, { price: e.target.value })} className="h-6 text-xs w-20" placeholder="Precio" />
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeItem(ci, ii)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <Input value={item.desc} onChange={(e) => updateItem(ci, ii, { desc: e.target.value })} className="h-6 text-xs" placeholder="Descripción" />
                            <Input value={item.image} onChange={(e) => updateItem(ci, ii, { image: e.target.value })} className="h-6 text-xs" placeholder="URL imagen" />
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => addItem(ci)}>
                          <Plus className="h-3 w-3 mr-1" /> Agregar producto
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" onClick={addCategory}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar categoría
                    </Button>
                  </div>
                )}

                {/* Theme tab */}
                {tab === "theme" && (
                  <div className="space-y-3">
                    {(
                      [
                        ["primary", "Color primario"],
                        ["accent", "Color acento (precios)"],
                        ["bg", "Fondo"],
                        ["surface", "Superficie (tarjetas)"],
                        ["text", "Texto"],
                        ["muted", "Texto secundario"],
                      ] as [keyof MenuConfig["theme"], string][]
                    ).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.theme[key]}
                          onChange={(e) => updateConfig({ ...config, theme: { ...config.theme, [key]: e.target.value } })}
                          className="h-8 w-10 rounded border border-border cursor-pointer"
                        />
                        <span className="text-xs text-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* JSON tab */}
                {tab === "json" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Edita el JSON directamente para cambiar textos, precios, imágenes y colores.</p>
                    <textarea
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      className="w-full min-h-[300px] rounded-md border border-border bg-background p-2 font-mono text-xs"
                    />
                    <Button variant="secondary" size="sm" className="w-full" onClick={applyJson}>
                      Aplicar cambios JSON
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Right: preview */}
            <div className="flex-1 bg-secondary/30 flex items-center justify-center p-4 overflow-auto">
              <div className="origin-top-left" style={{ transform: "scale(0.5)", width: 1920, height: 1080 }}>
                <iframe
                  srcDoc={renderedHtml}
                  className="rounded-lg border border-border/30"
                  style={{ width: 1920, height: 1080 }}
                  sandbox="allow-same-origin"
                  title="Vista previa del menú"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-border/30">
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
