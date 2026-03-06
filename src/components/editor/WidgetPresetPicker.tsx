import { WIDGET_PRESETS } from "./widgetPresets";

type Props = {
  orientation: "landscape" | "portrait";
  onInsertPreset: (presetId: string) => void;
};

export function WidgetPresetPicker({ orientation, onInsertPreset }: Props) {
  const mappedOrientation = orientation === "landscape" ? "horizontal" : "vertical";
  const list = WIDGET_PRESETS.filter((p) => p.orientation === mappedOrientation);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-sm font-semibold text-foreground">Presets Widget</p>
      <div className="grid gap-2">
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => onInsertPreset(p.id)}
            className="rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
          >
            <span className="font-medium text-foreground">{p.name}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              {p.w}×{p.h} · {p.type === "product_card" ? "Producto" : p.type === "promo" ? "Promo" : "Menú"}
            </span>
          </button>
        ))}
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground">No hay presets para esta orientación</p>
        )}
      </div>
    </div>
  );
}
