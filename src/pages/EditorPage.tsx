import React, { useMemo, useRef, useState } from "react";
import {
  Save,
  Send,
  Undo2,
  Redo2,
  LayoutGrid,
  Type,
  Image as ImageIcon,
  Star,
  Palette,
  Layers,
  Settings,
  PlaySquare,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";

type Orientation = "landscape" | "portrait";
type LayerItem = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

export default function EditorPage() {
  const [contentName, setContentName] = useState("Nuevo layout");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [customResolution, setCustomResolution] = useState(false);
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [zoom, setZoom] = useState(90);
  const [background, setBackground] = useState("#FFFFFF");
  const [tab, setTab] = useState<"settings" | "layers" | "actions">("settings");
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const stageWrapRef = useRef<HTMLDivElement>(null);

  const baseResolution = useMemo(() => {
    if (customResolution) return { w: customW, h: customH };
    return orientation === "landscape"
      ? { w: 1920, h: 1080 }
      : { w: 1080, h: 1920 };
  }, [orientation, customResolution, customW, customH]);

  const stageStyle = useMemo(
    () => ({
      width: `${baseResolution.w}px`,
      height: `${baseResolution.h}px`,
      transform: `scale(${zoom / 100})`,
      transformOrigin: "top left",
      background,
    }),
    [baseResolution, zoom, background]
  );

  const addLayer = (name: string) => {
    const id = crypto.randomUUID();
    setLayers((prev) => [
      ...prev,
      {
        id,
        name,
        x: 100 + prev.length * 20,
        y: 100 + prev.length * 20,
        w: 300,
        h: 180,
        color: "#8B5CF6",
      },
    ]);
  };

  const removeLayer = (id: string) =>
    setLayers((prev) => prev.filter((l) => l.id !== id));

  return (
    <div className="h-full w-full bg-muted text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="text-sm text-muted-foreground">
          Layouts &gt; {contentName} &gt; Main scene
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent">
            <Save className="mr-1 inline h-4 w-4" /> Guardar
          </button>
          <button className="rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Send className="mr-1 inline h-4 w-4" /> Enviar a pantalla
          </button>
        </div>
      </div>

      <div className="grid h-[calc(100%-56px)] grid-cols-[56px_1fr_320px]">
        {/* Left tools */}
        <aside className="border-r border-border bg-card p-2">
          <div className="flex flex-col gap-2">
            <button onClick={() => addLayer("Zona")} className="rounded p-2 hover:bg-accent" title="Zona">
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button onClick={() => addLayer("Texto")} className="rounded p-2 hover:bg-accent" title="Texto">
              <Type className="h-5 w-5" />
            </button>
            <button onClick={() => addLayer("Imagen")} className="rounded p-2 hover:bg-accent" title="Imagen">
              <ImageIcon className="h-5 w-5" />
            </button>
            <button onClick={() => addLayer("Widget")} className="rounded p-2 hover:bg-accent" title="Widget">
              <Star className="h-5 w-5" />
            </button>
            <button className="rounded p-2 hover:bg-accent" title="Paleta">
              <Palette className="h-5 w-5" />
            </button>
          </div>
        </aside>

        {/* Center canvas */}
        <main className="relative overflow-auto bg-muted p-6">
          <div className="mb-3 flex items-center justify-end gap-2">
            <button className="rounded border border-border bg-card px-2 py-1 hover:bg-accent">
              <Undo2 className="h-4 w-4" />
            </button>
            <button className="rounded border border-border bg-card px-2 py-1 hover:bg-accent">
              <Redo2 className="h-4 w-4" />
            </button>
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="rounded border border-border bg-card px-2 py-1 text-sm"
            >
              {[50, 75, 90, 100].map((z) => (
                <option key={z} value={z}>
                  {z}%
                </option>
              ))}
            </select>
          </div>

          <div
            ref={stageWrapRef}
            className="inline-block rounded border border-border bg-card shadow-lg"
          >
            <div style={stageStyle} className="relative overflow-hidden">
              {layers.map((l) => (
                <div
                  key={l.id}
                  className="absolute rounded border border-white/80 p-2 text-xs font-semibold text-white shadow"
                  style={{
                    left: l.x,
                    top: l.y,
                    width: l.w,
                    height: l.h,
                    background: l.color,
                  }}
                >
                  {l.name}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right panel */}
        <aside className="border-l border-border bg-card">
          <div className="flex border-b border-border text-sm">
            {([
              { id: "settings", label: "Ajustes", icon: Settings },
              { id: "layers", label: "Capas", icon: Layers },
              { id: "actions", label: "Acciones", icon: PlaySquare },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 px-3 py-2 ${
                  tab === id
                    ? "border-b-2 border-primary font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="mr-1 inline h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {tab === "settings" && (
            <div className="space-y-4 p-4 text-sm">
              <div>
                <label className="mb-1 block text-muted-foreground">Nombre del contenido</label>
                <input
                  value={contentName}
                  onChange={(e) => setContentName(e.target.value)}
                  className="w-full rounded border border-border bg-background px-2 py-1.5"
                />
              </div>
              <div>
                <label className="mb-1 block text-muted-foreground">Orientación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrientation("landscape")}
                    className={`rounded border border-border px-2 py-1.5 ${
                      orientation === "landscape" ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    Horizontal
                  </button>
                  <button
                    onClick={() => setOrientation("portrait")}
                    className={`rounded border border-border px-2 py-1.5 ${
                      orientation === "portrait" ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    Vertical
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-muted-foreground">Resolución</label>
                <select className="w-full rounded border border-border bg-background px-2 py-1.5">
                  <option>Full HD 1920×1080 (16:9)</option>
                  <option>Portrait 1080×1920 (9:16)</option>
                </select>
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customResolution}
                    onChange={(e) => setCustomResolution(e.target.checked)}
                  />
                  Resolución personalizada
                </label>
                {customResolution && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={customW}
                      onChange={(e) => setCustomW(Number(e.target.value))}
                      className="rounded border border-border bg-background px-2 py-1.5"
                    />
                    <input
                      type="number"
                      value={customH}
                      onChange={(e) => setCustomH(Number(e.target.value))}
                      className="rounded border border-border bg-background px-2 py-1.5"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-muted-foreground">Color de fondo</label>
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="h-10 w-full rounded border border-border p-1"
                />
              </div>
            </div>
          )}

          {tab === "layers" && (
            <div className="p-4">
              <button
                onClick={() => addLayer("Nueva zona")}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                <Plus className="h-4 w-4" /> Agregar capa
              </button>
              <div className="space-y-2">
                {layers.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded border border-border px-2 py-2 text-sm"
                  >
                    <span>{l.name}</span>
                    <button
                      onClick={() => removeLayer(l.id)}
                      className="rounded p-1 hover:bg-accent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "actions" && (
            <div className="space-y-2 p-4">
              <button className="flex w-full items-center justify-center gap-2 rounded border border-border px-3 py-2 text-sm hover:bg-accent">
                <Copy className="h-4 w-4" /> Duplicar layout
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded border border-destructive/50 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Eliminar layout
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
