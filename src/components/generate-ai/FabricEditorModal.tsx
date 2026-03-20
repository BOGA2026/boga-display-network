import { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import {
  X, Download, Save, Plus, Loader2, Type, Square, Circle, Minus,
  Triangle, Eye, EyeOff, ChevronUp, ChevronDown, Trash2, Image,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Proposal } from "./types";
import { CANVAS_SIZES, ALL_FONTS, SVG_ICONS } from "./types";

interface LayerItem {
  id: number;
  name: string;
  type: "text" | "shape" | "image";
  visible: boolean;
}

interface Props {
  proposal: Proposal;
  formato: string;
  cliente: string;
  onClose: () => void;
  onSave: (dataUrl: string) => Promise<void>;
  saving: boolean;
}

// Load Google Fonts
function useGoogleFonts() {
  useEffect(() => {
    const id = "visualia-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

export default function FabricEditorModal({ proposal, formato, cliente, onClose, onSave, saving }: Props) {
  useGoogleFonts();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<fabric.Canvas | null>(null);
  const idCounter = useRef(0);

  const [bgColor, setBgColor] = useState(proposal.background_color);
  const [showBgImage, setShowBgImage] = useState(true);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedObj, setSelectedObj] = useState<fabric.Object | null>(null);
  const [selectedType, setSelectedType] = useState<"text" | "shape" | "image" | null>(null);

  // For selected object properties
  const [selText, setSelText] = useState("");
  const [selFont, setSelFont] = useState("Inter");
  const [selSize, setSelSize] = useState(32);
  const [selColor, setSelColor] = useState("#FFFFFF");
  const [selStroke, setSelStroke] = useState("");
  const [selOpacity, setSelOpacity] = useState(100);
  const [selBold, setSelBold] = useState(false);
  const [selItalic, setSelItalic] = useState(false);
  const [selUnderline, setSelUnderline] = useState(false);
  const [selAlign, setSelAlign] = useState<string>("center");

  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];

  const nextId = () => ++idCounter.current;

  const refreshLayers = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const objs = fc.getObjects().filter((o: any) => o._customName !== "__overlay");
    setLayers(
      objs.map((o: any) => ({
        id: o._layerId ?? 0,
        name: o._customName ?? o.type ?? "object",
        type: o.type?.includes("text") ? "text" : o.type === "image" ? "image" : "shape",
        visible: o.visible !== false,
      }))
    );
  }, []);

  const syncSelection = useCallback((obj: fabric.Object | null) => {
    if (!obj) {
      setSelectedObj(null);
      setSelectedType(null);
      return;
    }
    setSelectedObj(obj);
    const isText = obj.type?.includes("text");
    const isImage = obj.type === "image";
    setSelectedType(isText ? "text" : isImage ? "image" : "shape");

    if (isText) {
      const t = obj as fabric.IText;
      setSelText(t.text ?? "");
      setSelFont((t.fontFamily as string) ?? "Inter");
      setSelSize(t.fontSize ?? 32);
      setSelColor((t.fill as string) ?? "#FFFFFF");
      setSelBold(t.fontWeight === "bold");
      setSelItalic(t.fontStyle === "italic");
      setSelUnderline(!!t.underline);
      setSelAlign(t.textAlign ?? "center");
    } else {
      setSelColor((obj.fill as string) ?? "#FFFFFF");
      setSelStroke((obj.stroke as string) ?? "");
    }
    setSelOpacity(Math.round((obj.opacity ?? 1) * 100));
  }, []);

  // Initialize canvas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvasRef.current || fcRef.current) return;
      const fc = new fabric.Canvas(canvasRef.current, {
        width: size.w,
        height: size.h,
        backgroundColor: proposal.background_color,
        selection: true,
        preserveObjectStacking: true,
      });

      fc.on("selection:created", (e: any) => syncSelection(e.selected?.[0] ?? null));
      fc.on("selection:updated", (e: any) => syncSelection(e.selected?.[0] ?? null));
      fc.on("selection:cleared", () => syncSelection(null));
      fc.on("object:added", () => refreshLayers());
      fc.on("object:removed", () => refreshLayers());
      fc.on("object:modified", () => {
        refreshLayers();
        const a = fc.getActiveObject();
        if (a) syncSelection(a);
      });

      // Load background image from Unsplash
      if (proposal.background_image_query) {
        const url = `https://source.unsplash.com/featured/${size.w}x${size.h}/?${encodeURIComponent(proposal.background_image_query)}`;
        fabric.Image.fromURL(
          url,
          (img) => {
            if (!img || !img.width) return;
            img.scaleToWidth(size.w);
            img.scaleToHeight(size.h);
            img.set({ left: 0, top: 0, selectable: false, evented: false, _customName: "__bgImage", _layerId: nextId() } as any);
            fc.insertAt(img, 0, false);

            // Overlay
            const overlay = new fabric.Rect({
              left: 0, top: 0, width: size.w, height: size.h,
              fill: `rgba(0,0,0,${proposal.overlay_opacity})`,
              selectable: false, evented: false,
            } as any);
            (overlay as any)._customName = "__overlay";
            (overlay as any)._layerId = nextId();
            fc.insertAt(overlay, 1, false);
            fc.renderAll();
            refreshLayers();
          },
          { crossOrigin: "anonymous" }
        );
      }

      // Layout positioning
      const align = proposal.layout;
      const originX = align === "izquierda" ? "left" : align === "derecha" ? "right" : "center";
      const textX = align === "izquierda" ? size.w * 0.1 : align === "derecha" ? size.w * 0.9 : size.w / 2;

      // Decorative elements
      if (proposal.elementos.includes("badge_superior")) {
        const badge = new fabric.IText(proposal.texto_cta, {
          left: textX, top: size.h * 0.12, originX, originY: "center",
          fontSize: 18, fontFamily: proposal.fuente_cuerpo, fontWeight: "bold",
          fill: proposal.color_texto, backgroundColor: proposal.color_acento,
          padding: 8, editable: true,
        } as any);
        (badge as any)._customName = "Badge CTA";
        (badge as any)._layerId = nextId();
        fc.add(badge);
      }

      // Main text
      const mainText = new fabric.IText(proposal.texto_principal, {
        left: textX, top: size.h * 0.38, originX, originY: "center",
        fontSize: 60, fontWeight: "bold", fontFamily: proposal.fuente_titulo,
        fill: proposal.color_texto, textAlign: align === "centrado" ? "center" : align,
        editable: true, lineHeight: 1.1,
      } as any);
      (mainText as any)._customName = "Título";
      (mainText as any)._layerId = nextId();
      fc.add(mainText);

      // Divider line
      if (proposal.elementos.includes("linea_divisora")) {
        const lineW = size.w * 0.25;
        const lineX = align === "izquierda" ? size.w * 0.1 : align === "derecha" ? size.w * 0.9 - lineW : (size.w - lineW) / 2;
        const line = new fabric.Line([lineX, size.h * 0.47, lineX + lineW, size.h * 0.47], {
          stroke: proposal.color_acento, strokeWidth: 3,
        } as any);
        (line as any)._customName = "Línea divisora";
        (line as any)._layerId = nextId();
        fc.add(line);
      }

      // Accent bar
      if (proposal.elementos.includes("rectangulo_acento")) {
        const bar = new fabric.Rect({
          left: 0, top: 0, width: 8, height: size.h,
          fill: proposal.color_acento, selectable: true,
        } as any);
        (bar as any)._customName = "Barra acento";
        (bar as any)._layerId = nextId();
        fc.add(bar);
      }

      // Secondary text
      const subText = new fabric.IText(proposal.texto_secundario, {
        left: textX, top: size.h * 0.55, originX, originY: "center",
        fontSize: 26, fontFamily: proposal.fuente_cuerpo,
        fill: proposal.color_texto, opacity: 0.8,
        textAlign: align === "centrado" ? "center" : align,
        editable: true,
      } as any);
      (subText as any)._customName = "Subtítulo";
      (subText as any)._layerId = nextId();
      fc.add(subText);

      // CTA text (if no badge)
      if (!proposal.elementos.includes("badge_superior") && proposal.texto_cta) {
        const cta = new fabric.IText(proposal.texto_cta, {
          left: textX, top: size.h * 0.72, originX, originY: "center",
          fontSize: 18, fontFamily: proposal.fuente_cuerpo, fontWeight: "bold",
          fill: proposal.color_acento, editable: true,
        } as any);
        (cta as any)._customName = "CTA";
        (cta as any)._layerId = nextId();
        fc.add(cta);
      }

      fc.renderAll();
      fcRef.current = fc;
      refreshLayers();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (fcRef.current) {
        fcRef.current.dispose();
        fcRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bg color sync
  useEffect(() => {
    if (fcRef.current) {
      fcRef.current.setBackgroundColor(bgColor, () => fcRef.current?.renderAll());
    }
  }, [bgColor]);

  // Toggle bg image
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    fc.getObjects().forEach((o: any) => {
      if (o._customName === "__bgImage" || o._customName === "__overlay") {
        o.visible = showBgImage;
      }
    });
    fc.renderAll();
    refreshLayers();
  }, [showBgImage, refreshLayers]);

  // ─── Actions ───
  const addText = () => {
    const fc = fcRef.current;
    if (!fc) return;
    const t = new fabric.IText("Nuevo texto", {
      left: size.w / 2, top: size.h / 2, originX: "center", originY: "center",
      fontSize: 32, fontFamily: "Inter", fill: proposal.color_texto, editable: true,
    } as any);
    (t as any)._customName = `Texto ${idCounter.current + 1}`;
    (t as any)._layerId = nextId();
    fc.add(t);
    fc.setActiveObject(t);
    fc.renderAll();
  };

  const addShape = (type: "rect" | "circle" | "line" | "triangle") => {
    const fc = fcRef.current;
    if (!fc) return;
    let obj: fabric.Object;
    const id = nextId();
    switch (type) {
      case "rect":
        obj = new fabric.Rect({ left: size.w / 2 - 100, top: size.h / 2 - 40, width: 200, height: 80, fill: proposal.color_acento, rx: 4, ry: 4 });
        (obj as any)._customName = "Rectángulo";
        break;
      case "circle":
        obj = new fabric.Circle({ left: size.w / 2 - 60, top: size.h / 2 - 60, radius: 60, fill: proposal.color_acento });
        (obj as any)._customName = "Círculo";
        break;
      case "triangle":
        obj = new fabric.Triangle({ left: size.w / 2 - 50, top: size.h / 2 - 50, width: 100, height: 100, fill: proposal.color_acento });
        (obj as any)._customName = "Triángulo";
        break;
      case "line":
        obj = new fabric.Line([size.w / 2 - 150, size.h / 2, size.w / 2 + 150, size.h / 2], { stroke: proposal.color_acento, strokeWidth: 3 });
        (obj as any)._customName = "Línea";
        break;
      default:
        return;
    }
    (obj as any)._layerId = id;
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.renderAll();
  };

  const addDivider = (style: "solid" | "dashed" | "band") => {
    const fc = fcRef.current;
    if (!fc) return;
    const id = nextId();
    if (style === "band") {
      const r = new fabric.Rect({ left: 0, top: size.h / 2 - 2, width: size.w, height: 4, fill: proposal.color_acento });
      (r as any)._customName = "Banda";
      (r as any)._layerId = id;
      fc.add(r);
    } else {
      const l = new fabric.Line([size.w * 0.1, size.h / 2, size.w * 0.9, size.h / 2], {
        stroke: proposal.color_acento, strokeWidth: 2,
        strokeDashArray: style === "dashed" ? [5, 5] : undefined,
      } as any);
      (l as any)._customName = style === "dashed" ? "Línea punteada" : "Línea simple";
      (l as any)._layerId = id;
      fc.add(l);
    }
    fc.renderAll();
  };

  const addSvgIcon = (name: string) => {
    const fc = fcRef.current;
    if (!fc) return;
    const icon = SVG_ICONS[name];
    if (!icon) return;
    const pathObj = new fabric.Path(icon.path, {
      left: size.w / 2 - 30, top: size.h / 2 - 30,
      fill: "#FFFFFF", stroke: "#FFFFFF", strokeWidth: 1.5,
      scaleX: 2.5, scaleY: 2.5,
    });
    (pathObj as any)._customName = name;
    (pathObj as any)._layerId = nextId();
    fc.add(pathObj);
    fc.setActiveObject(pathObj);
    fc.renderAll();
  };

  const uploadImage = (file: File, asBackground: boolean) => {
    const fc = fcRef.current;
    if (!fc) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      fabric.Image.fromURL(url, (img) => {
        if (asBackground) {
          img.scaleToWidth(size.w);
          img.scaleToHeight(size.h);
          img.set({ left: 0, top: 0, selectable: false, evented: false } as any);
          // Remove existing bg image
          fc.getObjects().forEach((o: any) => {
            if (o._customName === "__bgImage") fc.remove(o);
          });
          (img as any)._customName = "__bgImage";
          (img as any)._layerId = nextId();
          fc.insertAt(img, 0, false);
        } else {
          img.scaleToWidth(120);
          img.set({ left: 20, top: 20 } as any);
          (img as any)._customName = "Logo";
          (img as any)._layerId = nextId();
          fc.add(img);
          fc.setActiveObject(img);
        }
        fc.renderAll();
        refreshLayers();
      }, { crossOrigin: "anonymous" });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    const fc = fcRef.current;
    if (!fc || !selectedObj) return;
    fc.remove(selectedObj);
    fc.discardActiveObject();
    fc.renderAll();
    syncSelection(null);
  };

  const sendToBack = () => {
    const fc = fcRef.current;
    if (!fc || !selectedObj) return;
    fc.sendToBack(selectedObj);
    fc.renderAll();
    refreshLayers();
  };

  // ─── Property updates ───
  const updateProp = (key: string, val: any) => {
    const fc = fcRef.current;
    if (!fc || !selectedObj) return;
    (selectedObj as any).set(key, val);
    fc.renderAll();
  };

  // ─── Layer actions ───
  const selectLayer = (layerId: number) => {
    const fc = fcRef.current;
    if (!fc) return;
    const obj = fc.getObjects().find((o: any) => o._layerId === layerId);
    if (obj) {
      fc.setActiveObject(obj);
      fc.renderAll();
    }
  };

  const toggleLayerVisibility = (layerId: number) => {
    const fc = fcRef.current;
    if (!fc) return;
    const obj = fc.getObjects().find((o: any) => o._layerId === layerId);
    if (obj) {
      obj.visible = !obj.visible;
      fc.renderAll();
      refreshLayers();
    }
  };

  const moveLayer = (layerId: number, dir: "up" | "down") => {
    const fc = fcRef.current;
    if (!fc) return;
    const obj = fc.getObjects().find((o: any) => o._layerId === layerId);
    if (!obj) return;
    if (dir === "up") fc.bringForward(obj);
    else fc.sendBackwards(obj);
    fc.renderAll();
    refreshLayers();
  };

  // ─── Export ───
  const exportPNG = () => {
    const fc = fcRef.current;
    if (!fc) return;
    const dataUrl = fc.toDataURL({ format: "png", multiplier: 2 });
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    const slug = proposal.texto_principal.toLowerCase().replace(/\s+/g, "-").slice(0, 30);
    link.download = `visualia-${slug}-${date}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleSave = async () => {
    const fc = fcRef.current;
    if (!fc) return;
    const dataUrl = fc.toDataURL({ format: "png", multiplier: 2 });
    await onSave(dataUrl);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Render ───
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="flex flex-col w-[95vw] h-[95vh] rounded-xl border border-sidebar-border bg-sidebar shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="font-display text-sm font-bold truncate">{proposal.nombre}</h2>
            {cliente && <Badge variant="secondary" className="text-[10px]">{cliente}</Badge>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="gradient-primary glow-primary-sm" onClick={exportPNG}>
              <Download className="h-3.5 w-3.5" /> Exportar PNG
            </Button>
            <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ─── Sidebar ─── */}
          <div className="w-[280px] shrink-0 border-r border-sidebar-border overflow-y-auto p-3 space-y-4 text-sm">
            {selectedObj && selectedType ? (
              /* ─── PROPERTIES PANEL ─── */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Propiedades</Label>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => { fcRef.current?.discardActiveObject(); fcRef.current?.renderAll(); syncSelection(null); }}>
                    ← Volver
                  </Button>
                </div>

                {selectedType === "text" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Texto</Label>
                      <Input
                        value={selText}
                        onChange={(e) => { setSelText(e.target.value); updateProp("text", e.target.value); }}
                        className="bg-background/50 border-sidebar-border text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Fuente</Label>
                      <Select value={selFont} onValueChange={(v) => { setSelFont(v); updateProp("fontFamily", v); }}>
                        <SelectTrigger className="bg-background/50 border-sidebar-border text-xs h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ALL_FONTS.map((f) => <SelectItem key={f} value={f}><span style={{ fontFamily: f }}>{f}</span></SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Tamaño: {selSize}px</Label>
                      <Slider min={12} max={120} step={1} value={[selSize]} onValueChange={([v]) => { setSelSize(v); updateProp("fontSize", v); }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground mr-1">Color</Label>
                      <input type="color" value={selColor} onChange={(e) => { setSelColor(e.target.value); updateProp("fill", e.target.value); }} className="h-7 w-7 rounded border border-sidebar-border cursor-pointer bg-transparent" />
                    </div>
                    <div className="flex gap-1">
                      {[
                        { icon: Bold, key: "fontWeight", active: selBold, on: "bold", off: "normal", set: setSelBold },
                        { icon: Italic, key: "fontStyle", active: selItalic, on: "italic", off: "normal", set: setSelItalic },
                        { icon: Underline, key: "underline", active: selUnderline, on: true, off: false, set: setSelUnderline },
                      ].map(({ icon: Icon, key, active, on, off, set }) => (
                        <Button key={key} size="icon" variant={active ? "default" : "outline"} className="h-7 w-7 border-sidebar-border"
                          onClick={() => { set(!active); updateProp(key, active ? off : on); }}>
                          <Icon className="h-3.5 w-3.5" />
                        </Button>
                      ))}
                      <div className="w-px bg-sidebar-border mx-1" />
                      {[
                        { icon: AlignLeft, val: "left" },
                        { icon: AlignCenter, val: "center" },
                        { icon: AlignRight, val: "right" },
                      ].map(({ icon: Icon, val }) => (
                        <Button key={val} size="icon" variant={selAlign === val ? "default" : "outline"} className="h-7 w-7 border-sidebar-border"
                          onClick={() => { setSelAlign(val); updateProp("textAlign", val); }}>
                          <Icon className="h-3.5 w-3.5" />
                        </Button>
                      ))}
                    </div>
                  </>
                )}

                {selectedType === "shape" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Fill</Label>
                      <input type="color" value={selColor} onChange={(e) => { setSelColor(e.target.value); updateProp("fill", e.target.value); }} className="h-7 w-7 rounded border border-sidebar-border cursor-pointer bg-transparent" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Stroke</Label>
                      <input type="color" value={selStroke} onChange={(e) => { setSelStroke(e.target.value); updateProp("stroke", e.target.value); }} className="h-7 w-7 rounded border border-sidebar-border cursor-pointer bg-transparent" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Opacidad: {selOpacity}%</Label>
                      <Slider min={0} max={100} step={1} value={[selOpacity]} onValueChange={([v]) => { setSelOpacity(v); updateProp("opacity", v / 100); }} />
                    </div>
                  </>
                )}

                {selectedType === "image" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Opacidad: {selOpacity}%</Label>
                      <Slider min={0} max={100} step={1} value={[selOpacity]} onValueChange={([v]) => { setSelOpacity(v); updateProp("opacity", v / 100); }} />
                    </div>
                    <Button variant="outline" size="sm" className="w-full border-sidebar-border text-xs" onClick={sendToBack}>
                      Enviar al fondo
                    </Button>
                  </>
                )}

                <Button variant="destructive" size="sm" className="w-full text-xs" onClick={deleteSelected}>
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar elemento
                </Button>
              </div>
            ) : (
              /* ─── TOOLS PANEL ─── */
              <div className="space-y-4">
                {/* Text */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Texto</Label>
                  <Button variant="outline" size="sm" className="w-full border-sidebar-border text-xs" onClick={addText}>
                    <Plus className="h-3.5 w-3.5" /> Agregar texto
                  </Button>
                </div>

                {/* Background */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fondo</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-7 w-7 rounded border border-sidebar-border cursor-pointer bg-transparent" />
                    <span className="text-[10px] text-muted-foreground font-mono">{bgColor}</span>
                  </div>
                  {proposal.background_image_query && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Imagen de fondo</span>
                      <Switch checked={showBgImage} onCheckedChange={setShowBgImage} />
                    </div>
                  )}
                </div>

                {/* AI Colors */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Colores IA</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { l: "Fondo", v: proposal.background_color },
                      { l: "Texto", v: proposal.color_texto },
                      { l: "Acento", v: proposal.color_acento },
                    ].map((c) => (
                      <button key={c.l} onClick={() => { if (selectedObj) updateProp("fill", c.v); }}
                        className="flex items-center gap-1 rounded border border-sidebar-border bg-background/30 px-2 py-1 text-[10px] hover:bg-background/50 active:scale-95 transition-all">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: c.v }} /> {c.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Imagen del cliente</Label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0], false); }} />
                  <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0], true); }} />
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button variant="outline" size="sm" className="border-sidebar-border text-[10px] h-7" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-3 w-3" /> Logo
                    </Button>
                    <Button variant="outline" size="sm" className="border-sidebar-border text-[10px] h-7" onClick={() => bgFileInputRef.current?.click()}>
                      <Image className="h-3 w-3" /> Fondo
                    </Button>
                  </div>
                </div>

                {/* Elements */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Formas</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { icon: Square, fn: () => addShape("rect") },
                      { icon: Circle, fn: () => addShape("circle") },
                      { icon: Minus, fn: () => addShape("line") },
                      { icon: Triangle, fn: () => addShape("triangle") },
                    ].map(({ icon: Icon, fn }, i) => (
                      <Button key={i} variant="outline" size="icon" className="h-8 w-8 border-sidebar-border" onClick={fn}>
                        <Icon className="h-3.5 w-3.5" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Íconos</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.keys(SVG_ICONS).map((name) => (
                      <Button key={name} variant="outline" size="sm" className="border-sidebar-border text-[10px] h-7" onClick={() => addSvgIcon(name)}>
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Divisores</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { l: "Simple", s: "solid" as const },
                      { l: "Puntos", s: "dashed" as const },
                      { l: "Banda", s: "band" as const },
                    ].map(({ l, s }) => (
                      <Button key={s} variant="outline" size="sm" className="border-sidebar-border text-[10px] h-7" onClick={() => addDivider(s)}>
                        {l}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Formato</Label>
                  <div className="rounded border border-sidebar-border bg-background/30 px-2 py-1.5 text-[10px] text-muted-foreground">
                    {formato} — {size.w}×{size.h}px
                  </div>
                </div>

                {/* Layers */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Capas ({layers.length})</Label>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {[...layers].reverse().map((layer) => (
                      <div
                        key={layer.id}
                        className={cn(
                          "flex items-center gap-1 rounded px-1.5 py-1 text-[10px] cursor-pointer transition-colors",
                          selectedObj && (selectedObj as any)._layerId === layer.id
                            ? "bg-primary/20 text-primary"
                            : "hover:bg-background/40"
                        )}
                        onClick={() => selectLayer(layer.id)}
                      >
                        {layer.type === "text" ? <Type className="h-3 w-3 shrink-0" /> : layer.type === "image" ? <Image className="h-3 w-3 shrink-0" /> : <Square className="h-3 w-3 shrink-0" />}
                        <span className="flex-1 truncate">{layer.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="p-0.5 hover:text-primary">
                          {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, "up"); }} className="p-0.5 hover:text-primary">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, "down"); }} className="p-0.5 hover:text-primary">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Canvas ─── */}
          <div className="flex-1 flex items-center justify-center bg-background/30 overflow-auto p-4">
            <div className="shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)", lineHeight: 0 }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}