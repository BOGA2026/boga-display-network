import React, { useMemo, useRef, useState, useCallback } from "react";
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
import {
  TextLayerPreview,
  TextStylePanel,
  defaultTextStyle,
  type TextStyle,
} from "@/components/editor/EditorTextTools";
import { PresetPicker } from "@/components/editor/PresetPicker";
import { DraggableLayer } from "@/components/editor/DraggableLayer";
import { CanvasAlignToolbar } from "@/components/editor/CanvasAlignToolbar";

type Orientation = "landscape" | "portrait";
type LayerType = "zone" | "text" | "image" | "widget";
type LayerItem = {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  textStyle?: TextStyle;
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
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [guides, setGuides] = useState({ v: false, h: false });
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

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

  const addLayer = (name: string, type: LayerType) => {
    const id = crypto.randomUUID();
    const isText = type === "text";
    setLayers((prev) => [
      ...prev,
      {
        id,
        name,
        type,
        x: 100 + prev.length * 20,
        y: 100 + prev.length * 20,
        w: isText ? 700 : 300,
        h: isText ? 120 : 180,
        color: isText ? "transparent" : "#8B5CF6",
        textStyle: isText ? { ...defaultTextStyle } : undefined,
      },
    ]);
    if (isText) {
      setSelectedLayerId(id);
      setTab("settings");
    }
  };

  const removeLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const updateLayerTextStyle = (id: string, ts: TextStyle) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, textStyle: ts } : l))
    );
  };

  const SNAP = 10;
  const moveLayer = (id: string, rawX: number, rawY: number) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    let x = rawX;
    let y = rawY;
    const cx = x + layer.w / 2;
    const cy = y + layer.h / 2;
    const canvasCx = baseResolution.w / 2;
    const canvasCy = baseResolution.h / 2;
    let showV = false, showH = false;
    if (Math.abs(cx - canvasCx) <= SNAP) { x = Math.round(canvasCx - layer.w / 2); showV = true; }
    if (Math.abs(cy - canvasCy) <= SNAP) { y = Math.round(canvasCy - layer.h / 2); showH = true; }
    setGuides({ v: showV, h: showH });
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, x, y } : l)));
  };

  const resizeLayer = (id: string, w: number, h: number) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, w, h } : l)));
  };

  const handleDoubleClick = useCallback((id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer?.type === "text") {
      setEditingLayerId(id);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [layers]);

  const handleCanvasClick = useCallback(() => {
    setEditingLayerId(null);
    setGuides({ v: false, h: false });
  }, []);

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
            <button onClick={() => addLayer("Zona", "zone")} className="rounded p-2 hover:bg-accent" title="Zona">
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button onClick={() => addLayer("Texto", "text")} className="rounded p-2 hover:bg-accent" title="Texto">
              <Type className="h-5 w-5" />
            </button>
            <button onClick={() => addLayer("Imagen", "image")} className="rounded p-2 hover:bg-accent" title="Imagen">
              <ImageIcon className="h-5 w-5" />
            </button>
            <button onClick={() => addLayer("Widget", "widget")} className="rounded p-2 hover:bg-accent" title="Widget">
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
            <div style={stageStyle} className="relative overflow-hidden" onClick={handleCanvasClick}>
              {layers.map((l) => {
                const isEditing = editingLayerId === l.id;
                return (
                  <DraggableLayer
                    key={l.id}
                    id={l.id}
                    x={l.x}
                    y={l.y}
                    w={l.w}
                    h={l.h}
                    zoom={zoom}
                    selected={selectedLayerId === l.id}
                    editing={isEditing}
                    onSelect={(id) => {
                      setSelectedLayerId(id);
                      if (l.type === "text") setTab("settings");
                    }}
                    onDoubleClick={handleDoubleClick}
                    onMove={moveLayer}
                    onResize={resizeLayer}
                  >
                    {l.type === "text" && l.textStyle ? (
                      isEditing ? (
                        <div
                          className="h-full w-full flex items-center"
                          style={{
                            padding: `${l.textStyle.paddingY}px ${l.textStyle.paddingX}px`,
                            background:
                              l.textStyle.bannerStyle === "none"
                                ? "transparent"
                                : l.textStyle.bannerStyle === "solid"
                                ? l.textStyle.bannerColor
                                : `linear-gradient(90deg, ${l.textStyle.bannerFrom}, ${l.textStyle.bannerTo})`,
                            borderRadius: l.textStyle.borderRadius,
                          }}
                        >
                          <textarea
                            ref={textareaRef}
                            value={l.textStyle.content}
                            onChange={(e) =>
                              updateLayerTextStyle(l.id, { ...l.textStyle!, content: e.target.value })
                            }
                            onBlur={() => setEditingLayerId(null)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-full bg-transparent border-none outline-none resize-none"
                            style={{
                              color: l.textStyle.color,
                              fontFamily: l.textStyle.fontFamily,
                              fontSize: `${l.textStyle.fontSize}px`,
                              fontWeight: l.textStyle.fontWeight,
                              lineHeight: l.textStyle.lineHeight,
                              letterSpacing: `${l.textStyle.letterSpacing}px`,
                              textAlign: l.textStyle.textAlign,
                              textIndent: `${l.textStyle.textIndent}px`,
                            }}
                          />
                        </div>
                      ) : (
                        <TextLayerPreview style={l.textStyle} />
                      )
                    ) : (
                      <div
                        className="h-full w-full rounded border border-white/80 p-2 text-xs font-semibold text-white shadow"
                        style={{ background: l.color }}
                      >
                        {l.name}
                      </div>
                    )}
                  </DraggableLayer>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right panel */}
        <aside className="border-l border-border bg-card overflow-y-auto">
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
              {/* Text layer style panel */}
              {selectedLayer ? (
                <>
                  <div className="rounded border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                    Editando: {selectedLayer.name}
                  </div>
                  <div>
                    <label className="mb-1 block text-muted-foreground text-xs">Alinear en canvas</label>
                    <CanvasAlignToolbar
                      canvasW={baseResolution.w}
                      canvasH={baseResolution.h}
                      layerX={selectedLayer.x}
                      layerY={selectedLayer.y}
                      layerW={selectedLayer.w}
                      layerH={selectedLayer.h}
                      onMove={(x, y) => moveLayer(selectedLayer.id, x, y)}
                    />
                  </div>
                  {selectedLayer.type === "text" && selectedLayer.textStyle ? (
                    <>
                      <PresetPicker
                        onApply={(ts) => updateLayerTextStyle(selectedLayer.id, ts)}
                      />
                      <TextStylePanel
                        value={selectedLayer.textStyle}
                        onChange={(ts) => updateLayerTextStyle(selectedLayer.id, ts)}
                      />
                    </>
                  ) : null}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {tab === "layers" && (
            <div className="p-4">
              <button
                onClick={() => addLayer("Nueva zona", "zone")}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                <Plus className="h-4 w-4" /> Agregar capa
              </button>
              <div className="space-y-2">
                {layers.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedLayerId(l.id);
                      if (l.type === "text") setTab("settings");
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded border px-2 py-2 text-sm ${
                      selectedLayerId === l.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {l.type === "text" && <Type className="h-3.5 w-3.5 text-muted-foreground" />}
                      {l.type === "zone" && <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />}
                      {l.type === "image" && <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                      {l.type === "widget" && <Star className="h-3.5 w-3.5 text-muted-foreground" />}
                      {l.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLayer(l.id);
                      }}
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
