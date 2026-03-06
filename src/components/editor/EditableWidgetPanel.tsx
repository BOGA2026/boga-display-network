import React from "react";
import { Trash2, Plus } from "lucide-react";
import type { ProductCardData, MenuBoardData, PromoData } from "./widgetPresets";

type Props = {
  widgetType: "product_card" | "menu_board" | "promo";
  content: ProductCardData | MenuBoardData | PromoData;
  onUpdate: (nextContent: ProductCardData | MenuBoardData | PromoData) => void;
};

export function EditableWidgetPanel({ widgetType, content, onUpdate }: Props) {
  const update = (patch: Record<string, unknown>) => {
    onUpdate({ ...content, ...patch } as ProductCardData | MenuBoardData | PromoData);
  };

  const onReplaceImage = (file: File) => {
    const localUrl = URL.createObjectURL(file);
    update({ image: localUrl });
  };

  if (widgetType === "product_card") {
    const c = content as ProductCardData;
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-primary">Widget: Producto + Precio</p>
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
