import React from "react";
import { Trash2, Plus } from "lucide-react";
import type { ProductCardData, MenuBoardData, PromoData, WidgetTypography } from "./widgetPresets";
import { FONT_OPTIONS } from "./EditorTextTools";

type Props = {
  widgetType: "product_card" | "menu_board" | "promo";
  content: ProductCardData | MenuBoardData | PromoData;
  onUpdate: (nextContent: ProductCardData | MenuBoardData | PromoData) => void;
};

function TypographyControls({
  typography,
  onChange,
}: {
  typography: WidgetTypography;
  onChange: (next: WidgetTypography) => void;
}) {
  const t = {
    fontFamily: typography.fontFamily || "Inter",
    fontSize: typography.fontSize || 24,
    fontWeight: typography.fontWeight || 700,
  };

  return (
    <div className="space-y-2 rounded border border-border p-2">
      <p className="text-xs font-semibold text-muted-foreground">Tipografía</p>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Fuente</label>
        <select
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          value={t.fontFamily}
          onChange={(e) => onChange({ ...t, fontFamily: e.target.value })}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tamaño</label>
          <input
            type="number"
            min={10}
            max={120}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={t.fontSize}
            onChange={(e) => onChange({ ...t, fontSize: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Peso</label>
          <select
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={t.fontWeight}
            onChange={(e) => onChange({ ...t, fontWeight: Number(e.target.value) as 400 | 500 | 600 | 700 | 800 })}
          >
            <option value={400}>Regular (400)</option>
            <option value={500}>Medium (500)</option>
            <option value={600}>Semibold (600)</option>
            <option value={700}>Bold (700)</option>
            <option value={800}>Extra Bold (800)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function EditableWidgetPanel({ widgetType, content, onUpdate }: Props) {
  const update = (patch: Record<string, unknown>) => {
    onUpdate({ ...content, ...patch } as ProductCardData | MenuBoardData | PromoData);
  };

  const onReplaceImage = (file: File) => {
    const localUrl = URL.createObjectURL(file);
    update({ image: localUrl });
  };

  const currentTypo = (content as any).typography || {};

  if (widgetType === "product_card") {
    const c = content as ProductCardData;
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-primary">Widget: Producto + Precio</p>
        <TypographyControls
          typography={currentTypo}
          onChange={(t) => update({ typography: t })}
        />
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Título</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={c.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Subtítulo</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={c.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Precio</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={c.price}
            onChange={(e) => update({ price: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">URL imagen</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={c.image}
            onChange={(e) => update({ image: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Reemplazar imagen</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => e.target.files?.[0] && onReplaceImage(e.target.files[0])}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Color acento</label>
          <input
            className="h-10 w-full rounded border border-border p-1"
            type="color"
            value={c.accent}
            onChange={(e) => update({ accent: e.target.value })}
          />
        </div>
      </div>
    );
  }

  if (widgetType === "promo") {
    const c = content as PromoData;
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-primary">Widget: Promo Banner</p>
        <TypographyControls
          typography={currentTypo}
          onChange={(t) => update({ typography: t })}
        />
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Título</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={c.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Mensaje</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={c.message}
            onChange={(e) => update({ message: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">CTA (botón)</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            value={c.cta}
            onChange={(e) => update({ cta: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Color acento</label>
          <input
            className="h-10 w-full rounded border border-border p-1"
            type="color"
            value={c.accent}
            onChange={(e) => update({ accent: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Color fondo</label>
          <input
            className="h-10 w-full rounded border border-border p-1"
            type="color"
            value={c.bg}
            onChange={(e) => update({ bg: e.target.value })}
          />
        </div>
      </div>
    );
  }

  const c = content as MenuBoardData;
  const updateItem = (idx: number, patch: Partial<{ name: string; price: string }>) => {
    const next = c.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    update({ items: next });
  };
  const addItem = () => update({ items: [...c.items, { name: "Nuevo producto", price: "$0" }] });
  const removeItem = (idx: number) => update({ items: c.items.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-primary">Widget: Carta Menú</p>
      <TypographyControls
        typography={currentTypo}
        onChange={(t) => update({ typography: t })}
      />
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Encabezado</label>
        <input
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          value={c.header}
          onChange={(e) => update({ header: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Color acento</label>
        <input
          className="h-10 w-full rounded border border-border p-1"
          type="color"
          value={c.accent}
          onChange={(e) => update({ accent: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-2 block text-xs text-muted-foreground">Productos</label>
        <div className="space-y-2">
          {c.items.map((it, idx) => (
            <div key={idx} className="rounded border border-border p-2 space-y-1">
              <input
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                value={it.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
                placeholder="Nombre"
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                  value={it.price}
                  onChange={(e) => updateItem(idx, { price: e.target.value })}
                  placeholder="Precio"
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="rounded border border-destructive/30 px-2 py-1 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar producto
        </button>
      </div>
    </div>
  );
}
