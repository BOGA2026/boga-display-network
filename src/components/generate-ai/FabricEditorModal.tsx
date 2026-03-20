import { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import {
  X, Download, Save, Plus, Loader2, Type, Square, Circle, Minus,
  Triangle, Eye, EyeOff, ChevronUp, ChevronDown, Trash2, Image,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Upload, DollarSign, Clock, Tag, MapPin, QrCode, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ProductImage {
  id: string;
  url: string;
  name: string;
}

interface Props {
  proposal: Proposal;
  formato: string;
  cliente: string;
  onClose: () => void;
  onSave: (dataUrl: string) => Promise<void>;
  saving: boolean;
}

function useGoogleFonts() {
  useEffect(() => {
    const id = "visualia-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Oswald:wght@700;800&family=Bebas+Neue&family=Playfair+Display:wght@700;800&family=Space+Grotesk:wght@700&family=Montserrat:wght@700;800&family=Inter:wght@300;400;700&family=Roboto:wght@300;400;700&family=DM+Sans:wght@400;700&family=Source+Sans+Pro:wght@300;400;700&family=Cormorant:wght@300;400;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ─── Widget builder helpers ───
function createWidgetPrecio(fc: fabric.Canvas, acento: string, cw: number, ch: number, nextId: () => number) {
  const bg = new fabric.Rect({ width: 180, height: 120, fill: acento, rx: 12, ry: 12, originX: "center", originY: "center" } as any);
  const price = new fabric.IText("$0.00", { fontSize: 36, fontFamily: "Oswald", fontWeight: "bold", fill: "#FFFFFF", originX: "center", originY: "center", top: -14, editable: true, textAlign: "center" } as any);
  const label = new fabric.IText("precio especial", { fontSize: 13, fontFamily: "Inter", fill: "rgba(255,255,255,0.85)", originX: "center", originY: "center", top: 30, editable: true, textAlign: "center" } as any);
  const group = new fabric.Group([bg, price, label], { left: cw / 2 - 90, top: ch / 2 - 60, selectable: true, subTargetCheck: true } as any);
  (group as any)._customName = "Widget Precio";
  (group as any)._layerId = nextId();
  (group as any)._isWidget = true;
  fc.add(group);
  fc.setActiveObject(group);
  fc.renderAll();
}

function createWidgetHorario(fc: fabric.Canvas, cw: number, ch: number, nextId: () => number) {
  const bg = new fabric.Rect({ width: 220, height: 80, fill: "rgba(0,0,0,0.65)", rx: 8, ry: 8, originX: "center", originY: "center" } as any);
  const clockIcon = new fabric.Circle({ radius: 10, fill: "transparent", stroke: "#FFFFFF", strokeWidth: 1.5, originX: "center", originY: "center", left: -80, top: -2 } as any);
  const clockHand = new fabric.Line([0, 0, 0, -6], { stroke: "#FFFFFF", strokeWidth: 1.5, originX: "center", originY: "center", left: -80, top: -2 } as any);
  const txt = new fabric.IText("Lun-Vie 8am-8pm", { fontSize: 16, fontFamily: "Inter", fill: "#FFFFFF", originX: "center", originY: "center", left: 10, editable: true, textAlign: "center" } as any);
  const group = new fabric.Group([bg, clockIcon, clockHand, txt], { left: cw / 2 - 110, top: ch / 2 - 40, selectable: true, subTargetCheck: true } as any);
  (group as any)._customName = "Widget Horario";
  (group as any)._layerId = nextId();
  (group as any)._isWidget = true;
  fc.add(group);
  fc.setActiveObject(group);
  fc.renderAll();
}

function createWidgetBadge(fc: fabric.Canvas, acento: string, cw: number, nextId: () => number) {
  const bg = new fabric.Circle({ radius: 65, fill: acento, originX: "center", originY: "center" } as any);
  const txt = new fabric.IText("30%\nOFF", { fontSize: 28, fontFamily: "Oswald", fontWeight: "bold", fill: "#FFFFFF", originX: "center", originY: "center", textAlign: "center", lineHeight: 1.05, editable: true } as any);
  const group = new fabric.Group([bg, txt], { left: cw - 160, top: 30, selectable: true, subTargetCheck: true } as any);
  (group as any)._customName = "Widget Badge";
  (group as any)._layerId = nextId();
  (group as any)._isWidget = true;
  fc.add(group);
  fc.setActiveObject(group);
  fc.renderAll();
}

function createWidgetDireccion(fc: fabric.Canvas, cw: number, ch: number, nextId: () => number) {
  const bg = new fabric.Rect({ width: 240, height: 60, fill: "rgba(0,0,0,0.6)", rx: 8, ry: 8, originX: "center", originY: "center" } as any);
  const pin = new fabric.Path("M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z", {
    fill: "#FFFFFF", originX: "center", originY: "center", left: -95, scaleX: 0.9, scaleY: 0.9,
  } as any);
  const txt = new fabric.IText("Calle, Ciudad", { fontSize: 15, fontFamily: "Inter", fill: "#FFFFFF", originX: "center", originY: "center", left: 10, editable: true, textAlign: "center" } as any);
  const group = new fabric.Group([bg, pin, txt], { left: cw / 2 - 120, top: ch - 100, selectable: true, subTargetCheck: true } as any);
  (group as any)._customName = "Widget Dirección";
  (group as any)._layerId = nextId();
  (group as any)._isWidget = true;
  fc.add(group);
  fc.setActiveObject(group);
  fc.renderAll();
}

function createWidgetQR(fc: fabric.Canvas, cw: number, ch: number, nextId: () => number) {
  const bg = new fabric.Rect({ width: 100, height: 100, fill: "#FFFFFF", rx: 4, ry: 4, originX: "center", originY: "center", top: -12 } as any);
  // Simple QR pattern simulation
  const cells: fabric.Object[] = [bg];
  const cellSize = 8;
  const gridOffset = -36;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const isCorner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      const isFilled = isCorner || Math.random() > 0.55;
      if (isFilled) {
        cells.push(new fabric.Rect({
          width: cellSize, height: cellSize,
          fill: "#000000",
          left: gridOffset + c * cellSize,
          top: gridOffset + r * cellSize - 12,
          originX: "center", originY: "center",
        } as any));
      }
    }
  }
  const label = new fabric.IText("Escanéame", { fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fill: "#FFFFFF", originX: "center", originY: "center", top: 52, editable: true, textAlign: "center" } as any);
  cells.push(label);
  const group = new fabric.Group(cells, { left: cw - 140, top: ch - 160, selectable: true, subTargetCheck: true } as any);
  (group as any)._customName = "Widget QR";
  (group as any)._layerId = nextId();
  (group as any)._isWidget = true;
  fc.add(group);
  fc.setActiveObject(group);
  fc.renderAll();
}

function createWidgetRedes(fc: fabric.Canvas, cw: number, ch: number, nextId: () => number) {
  const bg = new fabric.Rect({ width: 200, height: 50, fill: "rgba(0,0,0,0.5)", rx: 25, ry: 25, originX: "center", originY: "center" } as any);
  // Simple circle icons for IG, FB, TT
  const ig = new fabric.Circle({ radius: 12, fill: "transparent", stroke: "#FFFFFF", strokeWidth: 1.5, originX: "center", originY: "center", left: -55 } as any);
  const fb = new fabric.Circle({ radius: 12, fill: "transparent", stroke: "#FFFFFF", strokeWidth: 1.5, originX: "center", originY: "center", left: -20 } as any);
  const tt = new fabric.Circle({ radius: 12, fill: "transparent", stroke: "#FFFFFF", strokeWidth: 1.5, originX: "center", originY: "center", left: 15 } as any);
  const igT = new fabric.Text("IG", { fontSize: 9, fontFamily: "Inter", fontWeight: "bold", fill: "#FFFFFF", originX: "center", originY: "center", left: -55 } as any);
  const fbT = new fabric.Text("FB", { fontSize: 9, fontFamily: "Inter", fontWeight: "bold", fill: "#FFFFFF", originX: "center", originY: "center", left: -20 } as any);
  const ttT = new fabric.Text("TT", { fontSize: 9, fontFamily: "Inter", fontWeight: "bold", fill: "#FFFFFF", originX: "center", originY: "center", left: 15 } as any);
  const handle = new fabric.IText("@usuario", { fontSize: 13, fontFamily: "Inter", fill: "#FFFFFF", originX: "center", originY: "center", left: 60, editable: true } as any);
  const group = new fabric.Group([bg, ig, fb, tt, igT, fbT, ttT, handle], { left: cw / 2 - 100, top: ch - 70, selectable: true, subTargetCheck: true } as any);
  (group as any)._customName = "Widget Redes";
  (group as any)._layerId = nextId();
  (group as any)._isWidget = true;
  fc.add(group);
  fc.setActiveObject(group);
  fc.renderAll();
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

  // Product images state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  // Image-specific property states
  const [selBrightness, setSelBrightness] = useState(0);
  const [selCircularClip, setSelCircularClip] = useState(false);

  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];

  const nextId = () => ++idCounter.current;

  const refreshLayers = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const objs = fc.getObjects().filter((o: any) => o._customName !== "__overlay" && o._customName !== "__bgImage");
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
      setSelBold(t.fontWeight === "bold" || (t.fontWeight as number) >= 700);
      setSelItalic(t.fontStyle === "italic");
      setSelUnderline(!!t.underline);
      setSelAlign(t.textAlign ?? "center");
    } else if (isImage) {
      setSelColor((obj.fill as string) ?? "#FFFFFF");
      // Read brightness filter if present
      const imgObj = obj as fabric.Image;
      const bFilter = imgObj.filters?.find((f: any) => f?.type === "Brightness") as any;
      setSelBrightness(bFilter ? Math.round(bFilter.brightness * 100) : 0);
      setSelCircularClip(!!imgObj.clipPath);
    } else {
      setSelColor((obj.fill as string) ?? "#FFFFFF");
      setSelStroke((obj.stroke as string) ?? "");
    }
    setSelOpacity(Math.round((obj.opacity ?? 1) * 100));
  }, []);

  // ─── Render decorative elements ───
  const renderDecorativeElements = useCallback((fc: fabric.Canvas, p: Proposal) => {
    const cw = size.w;
    const ch = size.h;
    const align = p.layout;
    const layoutLeft = align === "izquierda" ? cw * 0.1 : align === "derecha" ? cw * 0.3 : cw * 0.15;
    const tituloTop = ch * 0.35;

    if (!p.elementos_decorativos || p.elementos_decorativos.length === 0) return;

    for (const el of p.elementos_decorativos) {
      let obj: fabric.Object | null = null;

      switch (el.tipo) {
        case "linea_acento_vertical": {
          const left = align === "derecha" ? cw * 0.9 + 10 : layoutLeft - 20;
          obj = new fabric.Rect({
            left, top: tituloTop - 10,
            width: 4, height: 120,
            fill: el.color, opacity: el.opacity,
            selectable: true,
          } as any);
          (obj as any)._customName = "Línea acento";
          break;
        }
        case "rectangulo_fondo_texto": {
          obj = new fabric.Rect({
            left: layoutLeft - 20, top: tituloTop - 20,
            width: cw * 0.7, height: 160,
            fill: el.color, opacity: el.opacity,
            rx: 4, ry: 4, selectable: true,
          } as any);
          (obj as any)._customName = "Fondo texto";
          break;
        }
        case "badge_cta": {
          const badgeW = Math.max(p.texto_cta.length * 9 + 32, 100);
          const badgeLeft = align === "izquierda" ? layoutLeft : align === "derecha" ? cw * 0.9 - badgeW : (cw - badgeW) / 2;
          const badgeRect = new fabric.Rect({
            left: badgeLeft, top: tituloTop - 60,
            width: badgeW, height: 32,
            fill: p.color_acento, opacity: el.opacity,
            rx: 16, ry: 16, selectable: true,
          } as any);
          (badgeRect as any)._customName = "Badge BG";
          (badgeRect as any)._layerId = nextId();
          fc.add(badgeRect);

          const badgeText = new fabric.IText(p.texto_cta.toUpperCase(), {
            left: badgeLeft + badgeW / 2, top: tituloTop - 60 + 16,
            originX: "center", originY: "center",
            fontSize: 13, fontFamily: p.fuente_cuerpo,
            fontWeight: "bold", fill: "#000000",
            editable: true, selectable: true,
          } as any);
          (badgeText as any)._customName = "Badge CTA";
          (badgeText as any)._layerId = nextId();
          fc.add(badgeText);
          break;
        }
        case "banda_inferior": {
          obj = new fabric.Rect({
            left: 0, top: ch * 0.85,
            width: cw, height: ch * 0.15,
            fill: el.color, opacity: el.opacity,
            selectable: true,
          } as any);
          (obj as any)._customName = "Banda inferior";
          break;
        }
        case "punto_decorativo": {
          obj = new fabric.Circle({
            radius: 250,
            left: cw - 100, top: -100,
            fill: el.color, opacity: el.opacity,
            selectable: true,
          } as any);
          (obj as any)._customName = "Punto decorativo";
          break;
        }
        case "linea_horizontal": {
          const lx = align === "izquierda" ? layoutLeft : align === "derecha" ? cw * 0.5 : cw * 0.3;
          const lineObj = new fabric.Line([lx, tituloTop + 80, lx + 200, tituloTop + 80], {
            stroke: el.color, strokeWidth: 1,
            opacity: el.opacity, selectable: true,
          } as any);
          (lineObj as any)._customName = "Línea horizontal";
          (lineObj as any)._layerId = nextId();
          fc.add(lineObj);
          break;
        }
        case "numero_grande": {
          const year = new Date().getFullYear().toString();
          obj = new fabric.Text(year, {
            fontSize: 280, fontFamily: "Oswald",
            fill: el.color, opacity: el.opacity,
            left: cw * 0.3, top: ch * 0.1,
            selectable: true,
          } as any);
          (obj as any)._customName = "Número grande";
          break;
        }
        case "overlay_gradiente": {
          obj = new fabric.Rect({
            left: 0, top: 0, width: cw, height: ch,
            selectable: false, evented: false,
            fill: new fabric.Gradient({
              type: "linear",
              coords: { x1: 0, y1: 0, x2: 0, y2: ch },
              colorStops: [
                { offset: 0, color: "rgba(0,0,0,0)" },
                { offset: 0.5, color: "rgba(0,0,0,0.3)" },
                { offset: 1, color: "rgba(0,0,0,0.85)" },
              ],
            }),
          } as any);
          (obj as any)._customName = "Overlay gradiente";
          break;
        }
      }

      if (obj) {
        (obj as any)._layerId = nextId();
        fc.add(obj);
      }
    }
  }, [size]);

  // ─── Menu two-column renderer ───
  const renderMenuDosColumnas = useCallback((fc: fabric.Canvas, p: Proposal) => {
    const W = size.w;
    const H = size.h;
    const acento = p.color_acento;
    const blanco = p.color_texto;
    const fuente = p.fuente_titulo;
    const fuenteBody = p.fuente_cuerpo;

    // HEADER — nombre del restaurante
    const headerName = p.header?.nombre_restaurante || p.texto_principal;
    const headerObj = new fabric.IText(headerName.toUpperCase(), {
      left: W / 2, top: 28, originX: "center",
      fontSize: p.header?.size || 52,
      fontFamily: fuente, fontWeight: "700",
      fill: blanco, selectable: true, editable: true,
    } as any);
    (headerObj as any)._customName = "Nombre restaurante";
    (headerObj as any)._layerId = nextId();
    fc.add(headerObj);

    // Tagline
    const tagline = p.header?.tagline || p.texto_secundario;
    const tagObj = new fabric.IText(tagline, {
      left: W / 2, top: 90, originX: "center",
      fontSize: 16, fontFamily: fuenteBody,
      fontStyle: "italic", fill: acento,
      selectable: true, editable: true,
    } as any);
    (tagObj as any)._customName = "Tagline";
    (tagObj as any)._layerId = nextId();
    fc.add(tagObj);

    // Header separator line
    const sepLine = new fabric.Line([60, 115, W - 60, 115], {
      stroke: acento, strokeWidth: 1,
      opacity: 0.5, selectable: false,
    } as any);
    (sepLine as any)._customName = "Separador header";
    (sepLine as any)._layerId = nextId();
    fc.add(sepLine);

    // COLUMNS
    const secciones = p.secciones || [];
    const colIzq = secciones.slice(0, Math.ceil(secciones.length / 2));
    const colDer = secciones.slice(Math.ceil(secciones.length / 2));

    let yIzq = 130;
    let yDer = 130;
    const xIzq = 60;
    const xDer = W / 2 + 20;
    const colWidth = W / 2 - 80;

    const renderSeccion = (seccion: any, x: number, yStart: number): number => {
      let y = yStart;

      // Section name
      const secTitle = new fabric.IText(seccion.nombre.toUpperCase(), {
        left: x, top: y,
        fontSize: 13, fontFamily: fuenteBody,
        fontWeight: "700", fill: acento,
        selectable: true, editable: true,
      } as any);
      (secTitle as any)._customName = `Sección ${seccion.nombre}`;
      (secTitle as any)._layerId = nextId();
      fc.add(secTitle);
      y += 22;

      // Items
      (seccion.items || []).forEach((item: any) => {
        if (y > H - 80) return;

        // Dish name
        const platoObj = new fabric.IText(item.plato, {
          left: x, top: y,
          fontSize: 15, fontFamily: fuenteBody,
          fontWeight: "600", fill: blanco,
          selectable: true, editable: true,
        } as any);
        (platoObj as any)._customName = `Plato ${item.plato}`;
        (platoObj as any)._layerId = nextId();
        fc.add(platoObj);

        // Price
        const precioObj = new fabric.IText(item.precio, {
          left: x + colWidth, top: y,
          originX: "right",
          fontSize: 15, fontFamily: fuenteBody,
          fontWeight: "700", fill: acento,
          selectable: true, editable: true,
        } as any);
        (precioObj as any)._customName = `Precio ${item.plato}`;
        (precioObj as any)._layerId = nextId();
        fc.add(precioObj);
        y += 20;

        // Description
        if (item.descripcion) {
          const descObj = new fabric.IText(item.descripcion, {
            left: x, top: y,
            fontSize: 11, fontFamily: fuenteBody,
            fontStyle: "italic",
            fill: "rgba(255,255,255,0.55)",
            selectable: true, editable: true,
          } as any);
          (descObj as any)._customName = `Desc ${item.plato}`;
          (descObj as any)._layerId = nextId();
          fc.add(descObj);
          y += 18;
        }
        y += 6;
      });
      return y + 10;
    };

    colIzq.forEach((sec) => { yIzq = renderSeccion(sec, xIzq, yIzq); });
    colDer.forEach((sec) => { yDer = renderSeccion(sec, xDer, yDer); });

    // Vertical divider between columns
    const divider = new fabric.Line([W / 2, 120, W / 2, H - 60], {
      stroke: acento, strokeWidth: 0.5,
      opacity: 0.25, selectable: false,
    } as any);
    (divider as any)._customName = "Divisor columnas";
    (divider as any)._layerId = nextId();
    fc.add(divider);

    // FOOTER
    const footerText = p.footer_texto || p.texto_cta || "";
    if (footerText) {
      const footerObj = new fabric.IText(footerText.toUpperCase(), {
        left: W / 2, top: H - 35, originX: "center",
        fontSize: 14, fontFamily: fuenteBody,
        fontWeight: "500", fill: acento,
        selectable: true, editable: true,
      } as any);
      (footerObj as any)._customName = "Footer";
      (footerObj as any)._layerId = nextId();
      fc.add(footerObj);
    }
  }, [size, nextId]);

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

      // Delete key handler
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          const active = fc.getActiveObject();
          if (active && !(active as any).isEditing) {
            fc.remove(active);
            fc.discardActiveObject();
            fc.renderAll();
            syncSelection(null);
          }
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      (fc as any)._keyHandler = handleKeyDown;

      // Load background image
      const bgImageUrl = proposal.image_url;
      if (bgImageUrl) {
        fabric.Image.fromURL(
          bgImageUrl,
          (img) => {
            if (!img || !img.width) return;
            const scaleX = size.w / (img.width || 1);
            const scaleY = size.h / (img.height || 1);
            const scale = Math.max(scaleX, scaleY);
            img.set({
              scaleX: scale,
              scaleY: scale,
              left: (size.w - (img.width || 0) * scale) / 2,
              top: (size.h - (img.height || 0) * scale) / 2,
              originX: "left",
              originY: "top",
              selectable: false,
              evented: false,
            } as any);
            (img as any)._customName = "__bgImage";
            (img as any)._layerId = nextId();
            fc.insertAt(img, 0, false);

            const overlayColor = proposal.overlay_color ?? "#000000";
            const overlay = new fabric.Rect({
              left: 0, top: 0, width: size.w, height: size.h,
              fill: overlayColor,
              opacity: proposal.overlay_opacity,
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

      renderDecorativeElements(fc, proposal);

      const serializedProposal = JSON.stringify(proposal);
      const contentLooksLikeMenu = /(menu|almuerzo|plato|entrada|bebida|postre|precio|\$\d)/i.test(
        `${proposal.texto_principal} ${proposal.texto_secundario} ${proposal.texto_cta} ${proposal.concepto}`
      );
      const hasSections = Array.isArray(proposal.secciones) && proposal.secciones.length > 0;
      const isMenuLayout = proposal.tipo_layout === "menu_dos_columnas" || hasSections || contentLooksLikeMenu;

      console.log("PROPUESTA RECIBIDA:", serializedProposal);
      console.log("TIPO LAYOUT:", proposal.tipo_layout);
      console.log("SECCIONES:", proposal.secciones);

      if (isMenuLayout) {
        const menuProposal = { ...proposal };
        if (!menuProposal.secciones || menuProposal.secciones.length === 0) {
          menuProposal.tipo_layout = "menu_dos_columnas";
          menuProposal.secciones = [
            {
              nombre: "Almuerzo Ejecutivo",
              items: [
                { plato: "Sopa del día", descripcion: "Receta de la casa", precio: "$15.000" },
                { plato: "Bandeja Paisa", descripcion: "Frijoles, chicharrón, chorizo", precio: "$32.000" },
                { plato: "Sancocho de Gallina", descripcion: "Receta tradicional tolimense", precio: "$28.000" },
              ],
            },
            {
              nombre: "Especialidades",
              items: [
                { plato: "Trucha al Ajillo", descripcion: "Con papas y ensalada fresca", precio: "$38.000" },
                { plato: "Mojarra Frita", descripcion: "Acompañada de patacones", precio: "$35.000" },
                { plato: "Cazuela de Mariscos", descripcion: "En salsa criolla", precio: "$45.000" },
              ],
            },
            {
              nombre: "Bebidas",
              items: [
                { plato: "Jugo Natural", descripcion: "Lulo, maracuyá o mora", precio: "$5.000" },
                { plato: "Limonada de Coco", descripcion: "Refrescante y cremosa", precio: "$8.000" },
              ],
            },
          ];
          menuProposal.header = {
            nombre_restaurante: menuProposal.texto_principal || "EL FOGÓN DEL RÍO",
            tagline: menuProposal.texto_secundario || "Sabor auténtico colombiano",
            size: 48,
          };
          menuProposal.footer_texto = menuProposal.footer_texto || "Almuerzo completo $15.000 · Lunes a Sábado";
        }
        renderMenuDosColumnas(fc, menuProposal);
      } else {
        // Generic text layout
        const align = proposal.layout;
        const originX = align === "izquierda" ? "left" : align === "derecha" ? "right" : "center";
        const textX = align === "izquierda" ? size.w * 0.1 : align === "derecha" ? size.w * 0.9 : size.w / 2;
        const textAlign = align === "centrado" ? "center" : align === "izquierda" ? "left" : "right";

        const tSize = proposal.titulo_size ?? 84;
        const sSize = proposal.subtitulo_size ?? 28;

        const mainText = new fabric.IText(proposal.texto_principal, {
          left: textX, top: size.h * 0.38, originX, originY: "center",
          fontSize: tSize, fontWeight: "800", fontFamily: proposal.fuente_titulo,
          fill: proposal.color_texto, textAlign,
          editable: true, lineHeight: 1.05,
        } as any);
        (mainText as any)._customName = "Título";
        (mainText as any)._layerId = nextId();
        fc.add(mainText);

        const subText = new fabric.IText(proposal.texto_secundario, {
          left: textX, top: size.h * 0.55, originX, originY: "center",
          fontSize: sSize, fontWeight: "300", fontFamily: proposal.fuente_cuerpo,
          fill: proposal.color_texto, opacity: 0.85,
          textAlign, editable: true,
        } as any);
        (subText as any)._customName = "Subtítulo";
        (subText as any)._layerId = nextId();
        fc.add(subText);

        if (proposal.texto_cta) {
          const cta = new fabric.IText(proposal.texto_cta, {
            left: textX, top: size.h * 0.72, originX, originY: "center",
            fontSize: 18, fontFamily: proposal.fuente_cuerpo, fontWeight: "bold",
            fill: proposal.color_acento, editable: true,
          } as any);
          (cta as any)._customName = "CTA";
          (cta as any)._layerId = nextId();
          fc.add(cta);
        }
      }

      fc.renderAll();
      fcRef.current = fc;
      refreshLayers();
    }, 800);

    return () => {
      clearTimeout(timer);
      if (fcRef.current) {
        const handler = (fcRef.current as any)._keyHandler;
        if (handler) document.removeEventListener("keydown", handler);
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

  // ─── Product images ───
  const addProductImageToCanvas = (url: string, name: string) => {
    const fc = fcRef.current;
    if (!fc) return;
    fabric.Image.fromURL(url, (img) => {
      const scale = 200 / Math.max(img.width || 200, img.height || 200);
      img.set({
        left: size.w / 2 - 100,
        top: size.h / 2 - 100,
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        lockUniScaling: true,
      } as any);
      (img as any)._customName = name;
      (img as any)._layerId = nextId();
      (img as any)._isProductImage = true;
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
    }, { crossOrigin: "anonymous" });
  };

  const handleProductUpload = (files: FileList | null) => {
    if (!files) return;
    const remaining = 6 - productImages.length;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setProductImages((prev) => [...prev.slice(0, 5), { id, url, name: file.name.replace(/\.[^.]+$/, "") }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProductImage = (id: string) => {
    setProductImages((prev) => prev.filter((p) => p.id !== id));
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
    // Keep bg image and overlay always at the very back
    fc.getObjects().forEach((o: any) => {
      if (o._customName === "__bgImage") fc.sendToBack(o);
    });
    fc.getObjects().forEach((o: any) => {
      if (o._customName === "__overlay") { fc.sendToBack(o); fc.bringForward(o); }
    });
    fc.renderAll();
    refreshLayers();
  };

  const bringToFront = () => {
    const fc = fcRef.current;
    if (!fc || !selectedObj) return;
    fc.bringToFront(selectedObj);
    fc.renderAll();
    refreshLayers();
  };

  const updateProp = (key: string, val: any) => {
    const fc = fcRef.current;
    if (!fc || !selectedObj) return;
    (selectedObj as any).set(key, val);
    fc.renderAll();
  };

  const updateImageBrightness = (val: number) => {
    const fc = fcRef.current;
    if (!fc || !selectedObj || selectedObj.type !== "image") return;
    const imgObj = selectedObj as fabric.Image;
    setSelBrightness(val);
    imgObj.filters = [new fabric.Image.filters.Brightness({ brightness: val / 100 })];
    imgObj.applyFilters();
    fc.renderAll();
  };

  const toggleCircularClip = (checked: boolean) => {
    const fc = fcRef.current;
    if (!fc || !selectedObj || selectedObj.type !== "image") return;
    setSelCircularClip(checked);
    const imgObj = selectedObj as fabric.Image;
    if (checked) {
      const r = Math.min((imgObj.width || 200) / 2, (imgObj.height || 200) / 2);
      imgObj.clipPath = new fabric.Circle({
        radius: r,
        originX: "center",
        originY: "center",
      });
    } else {
      imgObj.clipPath = undefined as any;
    }
    fc.renderAll();
  };

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
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Widget definitions for sidebar buttons ───
  const WIDGETS = [
    { name: "Precio", icon: DollarSign, fn: () => { const fc = fcRef.current; if (fc) createWidgetPrecio(fc, proposal.color_acento, size.w, size.h, nextId); } },
    { name: "Horario", icon: Clock, fn: () => { const fc = fcRef.current; if (fc) createWidgetHorario(fc, size.w, size.h, nextId); } },
    { name: "Badge oferta", icon: Tag, fn: () => { const fc = fcRef.current; if (fc) createWidgetBadge(fc, proposal.color_acento, size.w, nextId); } },
    { name: "Dirección", icon: MapPin, fn: () => { const fc = fcRef.current; if (fc) createWidgetDireccion(fc, size.w, size.h, nextId); } },
    { name: "QR", icon: QrCode, fn: () => { const fc = fcRef.current; if (fc) createWidgetQR(fc, size.w, size.h, nextId); } },
    { name: "Redes", icon: Share2, fn: () => { const fc = fcRef.current; if (fc) createWidgetRedes(fc, size.w, size.h, nextId); } },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="flex flex-col w-[95vw] h-[95vh] rounded-xl border border-sidebar-border bg-sidebar shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="font-display text-sm font-bold truncate">{proposal.nombre}</h2>
            {proposal.concepto && <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">{proposal.concepto}</span>}
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
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Brillo: {selBrightness}%</Label>
                      <Slider min={-100} max={100} step={1} value={[selBrightness]} onValueChange={([v]) => updateImageBrightness(v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="circular-clip"
                        checked={selCircularClip}
                        onCheckedChange={(checked) => toggleCircularClip(!!checked)}
                      />
                      <Label htmlFor="circular-clip" className="text-xs text-muted-foreground cursor-pointer">Recorte circular</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button variant="outline" size="sm" className="border-sidebar-border text-xs" onClick={sendToBack}>
                        <ChevronDown className="h-3 w-3" /> Al fondo
                      </Button>
                      <Button variant="outline" size="sm" className="border-sidebar-border text-xs" onClick={bringToFront}>
                        <ChevronUp className="h-3 w-3" /> Al frente
                      </Button>
                    </div>
                  </>
                )}

                <Button variant="destructive" size="sm" className="w-full text-xs" onClick={deleteSelected}>
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar elemento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Texto</Label>
                  <Button variant="outline" size="sm" className="w-full border-sidebar-border text-xs" onClick={addText}>
                    <Plus className="h-3.5 w-3.5" /> Agregar texto
                  </Button>
                </div>

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

                {/* ─── Product Images ─── */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Productos</Label>
                  <input
                    ref={productFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => { handleProductUpload(e.target.files); if (e.target) e.target.value = ""; }}
                  />
                  <Button
                    variant="outline" size="sm"
                    className="w-full border-sidebar-border text-[10px] h-7"
                    onClick={() => productFileInputRef.current?.click()}
                    disabled={productImages.length >= 6}
                  >
                    <Plus className="h-3 w-3" /> Agregar producto {productImages.length > 0 && `(${productImages.length}/6)`}
                  </Button>
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {productImages.map((pi) => (
                        <div
                          key={pi.id}
                          className="relative group cursor-pointer rounded border border-sidebar-border overflow-hidden"
                          style={{ width: 60, height: 60 }}
                          onClick={() => addProductImageToCanvas(pi.url, pi.name)}
                        >
                          <img src={pi.url} alt={pi.name} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeProductImage(pi.id); }}
                            className="absolute top-0 right-0 bg-black/70 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── Widgets ─── */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Widgets</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {WIDGETS.map(({ name, icon: Icon, fn }) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        className="border-sidebar-border text-[10px] h-8 justify-start gap-1.5"
                        onClick={fn}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

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

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Formato</Label>
                  <div className="rounded border border-sidebar-border bg-background/30 px-2 py-1.5 text-[10px] text-muted-foreground">
                    {formato} — {size.w}×{size.h}px
                  </div>
                </div>

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
