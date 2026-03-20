import { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { X, Download, Save, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FONTS = ["Inter", "Roboto", "Montserrat", "Oswald", "Playfair Display"];

const CANVAS_SIZES: Record<string, { w: number; h: number }> = {
  "16:9": { w: 960, h: 540 },
  "9:16": { w: 540, h: 960 },
  "1:1": { w: 700, h: 700 },
};

export interface DesignResult {
  titulo: string;
  descripcion: string;
  background_color: string;
  texto_principal: string;
  texto_secundario: string;
  color_texto: string;
  color_acento: string;
  fuente: string;
}

interface Props {
  result: DesignResult;
  formato: string;
  cliente: string;
  onClose: () => void;
  onSave: (dataUrl: string) => Promise<void>;
  saving: boolean;
}

export default function FabricEditorModal({
  result,
  formato,
  cliente,
  onClose,
  onSave,
  saving,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<fabric.Canvas | null>(null);
  const [bgColor, setBgColor] = useState(result.background_color);
  const [selectedFont, setSelectedFont] = useState(result.fuente);
  const [ready, setReady] = useState(false);

  const size = CANVAS_SIZES[formato] ?? CANVAS_SIZES["16:9"];

  // Initialize canvas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvasRef.current || fcRef.current) return;

      const fc = new fabric.Canvas(canvasRef.current, {
        width: size.w,
        height: size.h,
        backgroundColor: result.background_color,
        selection: true,
      });

      // Main text
      const mainText = new fabric.IText(result.texto_principal, {
        left: size.w / 2,
        top: size.h * 0.38,
        originX: "center",
        originY: "center",
        fontSize: 48,
        fontWeight: "bold",
        fontFamily: result.fuente,
        fill: result.color_texto,
        textAlign: "center",
        editable: true,
      });

      // Secondary text
      const subText = new fabric.IText(result.texto_secundario, {
        left: size.w / 2,
        top: size.h * 0.55,
        originX: "center",
        originY: "center",
        fontSize: 24,
        fontFamily: result.fuente,
        fill: result.color_texto,
        opacity: 0.8,
        textAlign: "center",
        editable: true,
      });

      // Accent bar
      const accentBar = new fabric.Rect({
        left: size.w / 2,
        top: size.h * 0.47,
        originX: "center",
        originY: "center",
        width: 80,
        height: 4,
        fill: result.color_acento,
        rx: 2,
        ry: 2,
      });

      fc.add(mainText, accentBar, subText);
      fc.renderAll();
      fcRef.current = fc;
      setReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (fcRef.current) {
        fcRef.current.dispose();
        fcRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background color sync
  useEffect(() => {
    if (fcRef.current) {
      fcRef.current.setBackgroundColor(bgColor, () => fcRef.current?.renderAll());
    }
  }, [bgColor]);

  const addText = useCallback(() => {
    if (!fcRef.current) return;
    const t = new fabric.IText("Nuevo texto", {
      left: size.w / 2,
      top: size.h / 2,
      originX: "center",
      originY: "center",
      fontSize: 32,
      fontFamily: selectedFont,
      fill: result.color_texto,
      editable: true,
    });
    fcRef.current.add(t);
    fcRef.current.setActiveObject(t);
    fcRef.current.renderAll();
  }, [size, selectedFont, result.color_texto]);

  const applyColorToSelected = useCallback((color: string) => {
    const fc = fcRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (obj && "set" in obj) {
      obj.set("fill", color);
      fc.renderAll();
    }
  }, []);

  const changeFont = useCallback((font: string) => {
    setSelectedFont(font);
    const fc = fcRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (obj && obj.type?.includes("text")) {
      (obj as fabric.IText).set("fontFamily", font);
      fc.renderAll();
    }
  }, []);

  const exportPNG = useCallback(() => {
    if (!fcRef.current) return;
    const dataUrl = fcRef.current.toDataURL({ format: "png", multiplier: 2 });
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    const slug = result.titulo.toLowerCase().replace(/\s+/g, "-").slice(0, 30);
    link.download = `visualia-${slug}-${date}.png`;
    link.href = dataUrl;
    link.click();
  }, [result.titulo]);

  const handleSave = useCallback(async () => {
    if (!fcRef.current) return;
    const dataUrl = fcRef.current.toDataURL({ format: "png", multiplier: 2 });
    await onSave(dataUrl);
  }, [onSave]);

  const aiColors = [
    { label: "Fondo", value: result.background_color },
    { label: "Texto", value: result.color_texto },
    { label: "Acento", value: result.color_acento },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="flex flex-col w-[95vw] h-[95vh] rounded-xl border border-sidebar-border bg-sidebar shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="font-display text-base font-bold truncate">{result.titulo}</h2>
            {cliente && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {cliente}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="gradient-primary glow-primary-sm"
              onClick={exportPNG}
            >
              <Download className="h-3.5 w-3.5" />
              Exportar PNG
            </Button>
            <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar en Contenido
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left panel — tools */}
          <div className="w-[280px] shrink-0 border-r border-sidebar-border overflow-y-auto p-4 space-y-6">
            {/* Add text */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Texto</Label>
              <Button variant="outline" size="sm" className="w-full border-sidebar-border" onClick={addText}>
                <Plus className="h-3.5 w-3.5" />
                Agregar texto
              </Button>
            </div>

            {/* Background */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fondo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-9 w-9 rounded-md border border-sidebar-border cursor-pointer bg-transparent"
                />
                <span className="text-xs text-muted-foreground font-mono">{bgColor}</span>
              </div>
            </div>

            {/* AI Colors */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Colores IA</Label>
              <p className="text-[11px] text-muted-foreground">Clic para aplicar al elemento seleccionado</p>
              <div className="flex flex-wrap gap-2">
                {aiColors.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => applyColorToSelected(c.value)}
                    className="flex items-center gap-1.5 rounded-lg border border-sidebar-border bg-background/30 px-2.5 py-1.5 text-xs hover:bg-background/50 transition-colors active:scale-95"
                  >
                    <div
                      className="h-4 w-4 rounded-sm border border-white/10"
                      style={{ backgroundColor: c.value }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipografía</Label>
              <Select value={selectedFont} onValueChange={changeFont}>
                <SelectTrigger className="bg-background/50 border-sidebar-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f} value={f}>
                      <span style={{ fontFamily: f }}>{f}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format info */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Formato</Label>
              <div className="rounded-lg border border-sidebar-border bg-background/30 px-3 py-2 text-sm text-muted-foreground">
                {formato} — {size.w}×{size.h}px
              </div>
            </div>
          </div>

          {/* Right panel — Canvas */}
          <div className="flex-1 flex items-center justify-center bg-background/30 overflow-auto p-6">
            <div
              className="shrink-0"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                lineHeight: 0,
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}