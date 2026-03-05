import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
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
  Clipboard,
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
import ImageGalleryMenu from "@/components/editor/ImageGalleryMenu";
import { WidgetRenderer } from "@/components/editor/WidgetRenderer";
import { WidgetPresetPicker } from "@/components/editor/WidgetPresetPicker";
import { EditableWidgetPanel } from "@/components/editor/EditableWidgetPanel";
import { WIDGET_PRESETS, type ProductCardData, type MenuBoardData } from "@/components/editor/widgetPresets";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  imageUrl?: string;
  widgetType?: "product_card" | "menu_board";
  widgetData?: ProductCardData | MenuBoardData;
};

export default function EditorPage() {
  const [contentName, setContentName] = useState("Nuevo layout");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [customResolution, setCustomResolution] = useState(false);
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [zoom, setZoom] = useState(50);
  const [background, setBackground] = useState("#FFFFFF");
  const [tab, setTab] = useState<"settings" | "layers" | "actions">("settings");
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [guides, setGuides] = useState({ v: false, h: false });
  const [clipboard, setClipboard] = useState<LayerItem[] | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);

  // Undo / Redo history
  const historyRef = useRef<LayerItem[][]>([]);
  const futureRef = useRef<LayerItem[][]>([]);
  const dragSnapshotSaved = useRef(false);
  const MAX_HISTORY = 80;

  const cloneLayers = (ls: LayerItem[]) => ls.map((l) => ({ ...l }));

  const saveSnapshot = useCallback(() => {
    historyRef.current.push(cloneLayers(layers));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    futureRef.current = [];
  }, [layers]);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(cloneLayers(layers));
    setLayers(prev);
  }, [layers]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(cloneLayers(layers));
    setLayers(next);
  }, [layers]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedLayer = selectedIds.length === 1 ? layers.find((l) => l.id === selectedIds[0]) ?? null : null;

  const baseResolution = useMemo(() => {
    if (customResolution) return { w: customW, h: customH };
    return orientation === "landscape"
      ? { w: 1920, h: 1080 }
      : { w: 1080, h: 1920 };
  }, [orientation, customResolution, customW, customH]);

  const scale = zoom / 100;

  const stageStyle = useMemo(
    () => ({
      width: baseResolution.w,
      height: baseResolution.h,
      background,
    }),
    [baseResolution, background]
  );

  const addLayer = (name: string, type: LayerType) => {
    saveSnapshot();
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
      setSelectedIds([id]);
      setTab("settings");
    }
  };

  const addImageLayer = (url: string, name: string) => {
    saveSnapshot();
    const id = crypto.randomUUID();
    setLayers((prev) => [
      ...prev,
      {
        id,
        name: name || "Imagen",
        type: "image" as LayerType,
        x: 100 + prev.length * 20,
        y: 100 + prev.length * 20,
        w: 400,
        h: 300,
        color: "transparent",
        imageUrl: url,
      },
    ]);
    setSelectedIds([id]);
    setImageGalleryOpen(false);
  };


  const addWidgetFromPreset = (presetId: string) => {
    const preset = WIDGET_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    saveSnapshot();
    const id = crypto.randomUUID();
    setLayers((prev) => [
      ...prev,
      {
        id,
        name: preset.name,
        type: "widget" as LayerType,
        x: 80 + prev.length * 20,
        y: 80 + prev.length * 20,
        w: preset.w,
        h: preset.h,
        color: "transparent",
        widgetType: preset.type,
        widgetData: preset.data,
      },
    ]);
    setSelectedIds([id]);
    setWidgetPickerOpen(false);
  };

  const removeLayer = (id: string) => {
    saveSnapshot();
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const updateLayerTextStyle = (id: string, ts: TextStyle) => {
    saveSnapshot();
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, textStyle: ts } : l))
    );
  };

  const SNAP = 10;
  const moveLayerSingle = (id: string, rawX: number, rawY: number) => {
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

  // Multi-drag: move all selected layers by delta (no snapshot here — saved on drag start)
  const moveLayerDelta = useCallback((id: string, dx: number, dy: number) => {
    // Save snapshot once at drag start
    if (!dragSnapshotSaved.current) {
      historyRef.current.push(cloneLayers(layers));
      if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
      futureRef.current = [];
      dragSnapshotSaved.current = true;
    }
    if (selectedIds.length <= 1) {
      // Single layer: use absolute positioning with snap
      setLayers((prev) => {
        const layer = prev.find((l) => l.id === id);
        if (!layer) return prev;
        let x = layer.x + dx;
        let y = layer.y + dy;
        const cx = x + layer.w / 2;
        const cy = y + layer.h / 2;
        const canvasCx = baseResolution.w / 2;
        const canvasCy = baseResolution.h / 2;
        let showV = false, showH = false;
        if (Math.abs(cx - canvasCx) <= SNAP) { x = Math.round(canvasCx - layer.w / 2); showV = true; }
        if (Math.abs(cy - canvasCy) <= SNAP) { y = Math.round(canvasCy - layer.h / 2); showH = true; }
        setGuides({ v: showV, h: showH });
        return prev.map((l) => (l.id === id ? { ...l, x, y } : l));
      });
      return;
    }
    // Multi-select: move all selected layers by the same delta
    setLayers((prev) =>
      prev.map((l) =>
        selectedSet.has(l.id) ? { ...l, x: l.x + dx, y: l.y + dy } : l
      )
    );
  }, [selectedIds, selectedSet, baseResolution, SNAP]);

  const handleMoveEnd = useCallback(() => {
    dragSnapshotSaved.current = false;
    setGuides({ v: false, h: false });
  }, []);

  const resizeLayer = (id: string, w: number, h: number) => {
    if (!dragSnapshotSaved.current) {
      historyRef.current.push(cloneLayers(layers));
      if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
      futureRef.current = [];
      dragSnapshotSaved.current = true;
    }
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, w, h } : l)));
  };

  const handleResizeEnd = useCallback(() => {
    dragSnapshotSaved.current = false;
  }, []);

  const handleDoubleClick = useCallback((id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer?.type === "text") {
      setEditingLayerId(id);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [layers]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas background
    if (e.target !== canvasRef.current) return;
    setEditingLayerId(null);
    setSelectedIds([]);
    setGuides({ v: false, h: false });
  }, []);

  // Marquee selection
  const intersects = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const onCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Only start marquee on blank canvas area
    if (target !== canvasRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    marqueeStart.current = { x, y };
    setMarquee({ x, y, w: 0, h: 0 });
    setSelectedIds([]);
    setEditingLayerId(null);
  }, [scale]);

  const onCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!marqueeStart.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / scale;
    const cy = (e.clientY - rect.top) / scale;
    const sx = marqueeStart.current.x;
    const sy = marqueeStart.current.y;
    const box = {
      x: Math.min(sx, cx),
      y: Math.min(sy, cy),
      w: Math.abs(cx - sx),
      h: Math.abs(cy - sy),
    };
    setMarquee(box);
    const hit = layers.filter((l) => intersects(box, l)).map((l) => l.id);
    setSelectedIds(hit);
  }, [scale, layers]);

  const onCanvasPointerUp = useCallback(() => {
    marqueeStart.current = null;
    setTimeout(() => setMarquee(null), 0);
  }, []);

  // Copy / Paste
  const copySelected = useCallback(() => {
    const picked = layers.filter((l) => selectedSet.has(l.id));
    if (picked.length) setClipboard(picked.map((l) => ({ ...l })));
  }, [layers, selectedSet]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard?.length) return;
    saveSnapshot();
    const pasted = clipboard.map((l, idx) => ({
      ...l,
      id: crypto.randomUUID(),
      x: l.x + 24 + idx * 4,
      y: l.y + 24 + idx * 4,
    }));
    setLayers((prev) => [...prev, ...pasted]);
    setSelectedIds(pasted.map((p) => p.id));
  }, [clipboard]);

  const deleteSelected = useCallback(() => {
    saveSnapshot();
    setLayers((prev) => prev.filter((l) => !selectedSet.has(l.id)));
    setSelectedIds([]);
  }, [selectedSet, saveSnapshot]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); copySelected(); }
    if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); pasteClipboard(); }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (!editingLayerId) { e.preventDefault(); deleteSelected(); }
    }
    // Select all
    if (mod && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setSelectedIds(layers.map((l) => l.id));
    }
    // Undo: Ctrl+Z
    if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault(); undo();
    }
    // Redo: Ctrl+Shift+Z or Ctrl+Y
    if ((mod && e.key.toLowerCase() === "z" && e.shiftKey) || (mod && e.key.toLowerCase() === "y")) {
      e.preventDefault(); redo();
    }
  }, [copySelected, pasteClipboard, deleteSelected, editingLayerId, layers, undo, redo]);

  const handleLayerSelect = useCallback((id: string, additive: boolean) => {
    if (additive) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
    const layer = layers.find((l) => l.id === id);
    if (layer?.type === "text") setTab("settings");
  }, [layers]);

  return (
    <div className="h-full w-full bg-muted text-foreground" tabIndex={0} onKeyDown={onKeyDown} style={{ outline: "none" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="text-sm text-muted-foreground">
          Layouts &gt; {contentName} &gt; Main scene
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copySelected}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent"
            title="Copiar selección (Ctrl+C)"
          >
            <Copy className="mr-1 inline h-4 w-4" /> Copiar
          </button>
          <button
            onClick={pasteClipboard}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-accent"
            title="Pegar (Ctrl+V)"
          >
            <Clipboard className="mr-1 inline h-4 w-4" /> Pegar
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
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
            <Popover open={imageGalleryOpen} onOpenChange={setImageGalleryOpen}>
              <PopoverTrigger asChild>
                <button className="rounded p-2 hover:bg-accent" title="Imagen">
                  <ImageIcon className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-auto p-0 border-0 bg-transparent shadow-none">
                <ImageGalleryMenu onInsertImage={addImageLayer} />
              </PopoverContent>
            </Popover>
            <Popover open={widgetPickerOpen} onOpenChange={setWidgetPickerOpen}>
              <PopoverTrigger asChild>
                <button className="rounded p-2 hover:bg-accent" title="Widget">
                  <Star className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-72 p-0 border-0 bg-transparent shadow-none">
                <WidgetPresetPicker orientation={orientation} onInsertPreset={addWidgetFromPreset} />
              </PopoverContent>
            </Popover>
            <button className="rounded p-2 hover:bg-accent" title="Paleta">
              <Palette className="h-5 w-5" />
            </button>
          </div>
        </aside>

        {/* Center canvas */}
        <main className="relative flex flex-col bg-muted">
          {/* Canvas toolbar */}
          <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Lienzo: {baseResolution.w}×{baseResolution.h}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedIds.length > 0
                  ? `${selectedIds.length} capa${selectedIds.length > 1 ? "s" : ""} seleccionada${selectedIds.length > 1 ? "s" : ""}`
                  : "Sin selección"}
                {clipboard ? ` · ${clipboard.length} en portapapeles` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={undo} className="rounded border border-border bg-card px-2 py-1 hover:bg-accent" title="Deshacer (Ctrl+Z)">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={redo} className="rounded border border-border bg-card px-2 py-1 hover:bg-accent" title="Rehacer (Ctrl+Shift+Z)">
                <Redo2 className="h-4 w-4" />
              </button>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="rounded border border-border bg-card px-2 py-1 text-sm"
              >
                {[25, 50, 75, 100, 125, 150].map((z) => (
                  <option key={z} value={z}>
                    {z}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable canvas area */}
          <div className="flex-1 overflow-auto p-6">
            <div
              ref={stageWrapRef}
              className="inline-block"
              style={{
                width: baseResolution.w * scale,
                height: baseResolution.h * scale,
                minWidth: baseResolution.w * scale,
                minHeight: baseResolution.h * scale,
              }}
            >
              <div
                ref={canvasRef}
                style={{
                  ...stageStyle,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                className="relative overflow-hidden rounded border-2 border-border shadow-lg"
                onClick={handleCanvasClick}
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
              >
              {/* Snap guides */}
              {guides.v && (
                <div className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-50" style={{ left: baseResolution.w / 2 }} />
              )}
              {guides.h && (
                <div className="absolute left-0 right-0 h-px bg-cyan-400 pointer-events-none z-50" style={{ top: baseResolution.h / 2 }} />
              )}
              {/* Marquee selection rectangle */}
              {marquee && marquee.w > 2 && marquee.h > 2 && (
                <div
                  className="absolute border border-dashed border-cyan-400 pointer-events-none z-50"
                  style={{
                    left: marquee.x,
                    top: marquee.y,
                    width: marquee.w,
                    height: marquee.h,
                    background: "rgba(34, 211, 238, 0.12)",
                  }}
                />
              )}
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
                    selected={selectedSet.has(l.id)}
                    editing={isEditing}
                    onSelect={handleLayerSelect}
                    onDoubleClick={handleDoubleClick}
                    onMove={moveLayerDelta}
                    onMoveEnd={handleMoveEnd}
                    onResize={resizeLayer}
                    onDragEnd={handleResizeEnd}
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
                    ) : l.type === "image" && l.imageUrl ? (
                      <img
                        src={l.imageUrl}
                        alt={l.name}
                        className="h-full w-full object-cover rounded"
                        draggable={false}
                      />
                    ) : l.type === "widget" && l.widgetType && l.widgetData ? (
                      <WidgetRenderer
                        layer={{
                          widgetType: l.widgetType,
                          content: l.widgetData,
                          w: l.w,
                          h: l.h,
                        }}
                      />
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
                      onMove={(x, y) => moveLayerSingle(selectedLayer.id, x, y)}
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
                  ) : selectedLayer.type === "widget" && selectedLayer.widgetType && selectedLayer.widgetData ? (
                    <EditableWidgetPanel
                      widgetType={selectedLayer.widgetType}
                      content={selectedLayer.widgetData}
                      onUpdate={(nextContent) => {
                        saveSnapshot();
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === selectedLayer.id
                              ? { ...l, widgetData: nextContent }
                              : l
                          )
                        );
                      }}
                    />
                  ) : null}
                </>
              ) : selectedIds.length > 1 ? (
                <div className="rounded border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                  {selectedIds.length} capas seleccionadas — Usa Ctrl+C para copiar, Delete para eliminar
                </div>
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
                  {/* Mini preview */}
                  <div>
                    <label className="mb-1 block text-muted-foreground">Vista previa</label>
                    <div
                      className="relative rounded border border-border overflow-hidden bg-card"
                      style={{
                        width: "100%",
                        aspectRatio: `${baseResolution.w} / ${baseResolution.h}`,
                      }}
                    >
                      <div
                        style={{
                          width: baseResolution.w,
                          height: baseResolution.h,
                          transform: `scale(${280 / baseResolution.w})`,
                          transformOrigin: "top left",
                          background,
                        }}
                        className="relative overflow-hidden"
                      >
                        {layers.map((l) => (
                          <div
                            key={l.id}
                            className="absolute"
                            style={{
                              left: l.x,
                              top: l.y,
                              width: l.w,
                              height: l.h,
                            }}
                          >
                            {l.type === "image" && l.imageUrl ? (
                              <img src={l.imageUrl} alt="" className="h-full w-full object-cover" draggable={false} />
                            ) : l.type === "text" && l.textStyle ? (
                              <div className="h-full w-full" style={{
                                background: l.textStyle.bannerStyle === "solid" ? l.textStyle.bannerColor : "transparent",
                                color: l.textStyle.color,
                                fontSize: `${l.textStyle.fontSize}px`,
                                fontWeight: l.textStyle.fontWeight,
                                overflow: "hidden",
                              }}>
                                {l.textStyle.content}
                              </div>
                            ) : (
                              <div className="h-full w-full rounded" style={{ background: l.color }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
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
                    onClick={(e) => {
                      const additive = e.ctrlKey || e.metaKey || e.shiftKey;
                      handleLayerSelect(l.id, additive);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded border px-2 py-2 text-sm ${
                      selectedSet.has(l.id)
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
              <button
                onClick={copySelected}
                className="flex w-full items-center justify-center gap-2 rounded border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                <Copy className="h-4 w-4" /> Copiar selección
              </button>
              <button
                onClick={pasteClipboard}
                className="flex w-full items-center justify-center gap-2 rounded border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                <Clipboard className="h-4 w-4" /> Pegar
              </button>
              <button
                onClick={deleteSelected}
                className="flex w-full items-center justify-center gap-2 rounded border border-destructive/50 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Eliminar selección
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
