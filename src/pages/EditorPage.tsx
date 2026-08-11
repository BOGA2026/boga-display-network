import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { captureElement, preloadCapture } from "@/components/system/DeferredMount";
import simboloVisualia from "@/assets/simbolo-visualia.webp";
import {
  Undo2,
  Redo2,
  LayoutGrid,
  Type,
  Image as ImageIcon,
  Star,
  Shapes,
  Palette,
  Layers,
  Settings,
  PlaySquare,
  Plus,
  Trash2,
  Copy,
  Clipboard,
  Upload,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  BookmarkPlus,
  Film,
  Loader2,
  Hand,
  ZoomIn,
  ZoomOut,
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
import ElementsPanel, { type ElementInsertPayload } from "@/components/editor/ElementsPanel";
import { WidgetRenderer } from "@/components/editor/WidgetRenderer";
import { WidgetPresetPicker } from "@/components/editor/WidgetPresetPicker";
import { EditableWidgetPanel } from "@/components/editor/EditableWidgetPanel";
import { WIDGET_PRESETS, type ProductCardData, type MenuBoardData, type PromoData } from "@/components/editor/widgetPresets";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { storageThumb } from "@/lib/storageImage";
import { cn } from "@/lib/utils";
import { getBusinessId, getUserId } from "@/features/auth/tenant";
import { fetchBrandKit, type BrandKit } from "@/features/brand/api";
import { DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT, ensureFont } from "@/features/brand/fonts";
import { useTenant } from "@/features/auth/useTenant";
import { DEFAULT_ELEMENT_COLORS, toDataUri } from "@/features/editor/elements/svg";
import { fetchTemplate, isPlatformAdmin, saveTemplate, uploadTemplateAsset } from "@/features/templates/api";
import { documentToLayers, layersToDocument, validateTemplateDocument, fitFontSize } from "@/features/templates/document";
import { BUSINESS_TYPES, DEFAULT_SAFE_AREA, PIECE_TYPES, canvasFor } from "@/features/templates/types";

type Orientation = "landscape" | "portrait";
type LayerType = "zone" | "text" | "image" | "widget" | "video";
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
  /** Markup SVG original (elementos de la galería) para poder recolorear. */
  svgTemplate?: string;
  /** Color actual del elemento SVG. */
  elementColor?: string;
  videoUrl?: string;
  widgetType?: "product_card" | "menu_board" | "promo";
  widgetData?: ProductCardData | MenuBoardData | PromoData;
  /** Plantillas: el fondo y las capas fijas no se mueven ni se borran. */
  locked?: boolean;
  /** Nombre en cristiano de la capa dentro de la plantilla. */
  templateLabel?: string;
  templateKind?: "texto" | "precio" | "foto" | "logo";
  /** "foto" se recorta al marco; "recorte" (PNG sin fondo) se muestra entero. */
  expects?: "foto" | "recorte";
  maxChars?: number;
  /** Tamaño original de la plantilla: el auto-ajuste no baja del 70 %. */
  baseFontSize?: number;
};

export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const [contentId, setContentId] = useState<string | null>(null);
  /** Plantillas: fondo bloqueado + capas editables marcadas por Visualia. */
  const [plantillaOrigen, setPlantillaOrigen] = useState<string | null>(null);
  const [esAdminPlataforma, setEsAdminPlataforma] = useState(false);
  const [tplDialogOpen, setTplDialogOpen] = useState(false);
  const [tplForm, setTplForm] = useState({
    name: "",
    business_type: "restaurante",
    piece_type: "menu",
  });
  const [contentName, setContentName] = useState("Nuevo layout");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [customResolution, setCustomResolution] = useState(false);
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [zoom, setZoom] = useState(50);
  const [background, setBackground] = useState("#FFFFFF");
  const [tab, setTab] = useState<"settings" | "layers" | "actions" | "presets">("settings");
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<{ id: string; name: string; thumbnail_url: string | null; file_url: string | null }[]>([]);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  // Cualquier cambio en el lienzo invalida el último guardado.
  useEffect(() => {
    setDirty(true);
  }, [layers, background]);
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
  const [elementsPanelOpen, setElementsPanelOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Pan / hand tool (drag to scroll when zoomed)
  const [panMode, setPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);

  useEffect(() => {
    const isFormField = (el: EventTarget | null) => {
      const tag = (el as HTMLElement)?.tagName;
      const editable = (el as HTMLElement)?.isContentEditable;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable;
    };
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isFormField(e.target) && !e.repeat) {
        e.preventDefault();
        setPanMode(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isFormField(e.target)) setPanMode(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const onPanMouseDown = (e: React.MouseEvent) => {
    if (!panMode || !scrollAreaRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    panState.current = {
      x: e.clientX,
      y: e.clientY,
      sl: scrollAreaRef.current.scrollLeft,
      st: scrollAreaRef.current.scrollTop,
    };
    setIsPanning(true);
  };
  const onPanMouseMove = (e: React.MouseEvent) => {
    if (!panState.current || !scrollAreaRef.current) return;
    scrollAreaRef.current.scrollLeft = panState.current.sl - (e.clientX - panState.current.x);
    scrollAreaRef.current.scrollTop = panState.current.st - (e.clientY - panState.current.y);
  };
  const onPanMouseUp = () => {
    panState.current = null;
    setIsPanning(false);
  };



  // Undo / Redo history
  const historyRef = useRef<LayerItem[][]>([]);
  const futureRef = useRef<LayerItem[][]>([]);
  const dragSnapshotSaved = useRef(false);
  const MAX_HISTORY = 80;

  /**
   * La marca del negocio (Contenido → Tu marca). El editor arranca con esa
   * paleta y esas tipografías: nadie vuelve a elegir el mismo rojo dos veces.
   */
  const [brand, setBrand] = useState<BrandKit | null>(null);
  useEffect(() => {
    let vivo = true;
    fetchBrandKit()
      .then((k) => {
        if (!vivo || !k) return;
        setBrand(k);
        ensureFont(k.heading_font ?? DEFAULT_HEADING_FONT);
        ensureFont(k.body_font ?? DEFAULT_BODY_FONT);
        if (!searchParams.get("contentId")) setBackground(k.background_color);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
    // Solo al montar: cambiar de pieza no debe pisar el lienzo abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Estilo de texto por defecto, ya vestido con la marca. */
  const brandTextStyle = useCallback(
    (): TextStyle => ({
      ...defaultTextStyle,
      fontFamily: brand?.heading_font ?? defaultTextStyle.fontFamily,
      color: brand?.text_color ?? defaultTextStyle.color,
      bannerColor: brand?.primary_color ?? defaultTextStyle.bannerColor,
      bannerFrom: brand?.primary_color ?? defaultTextStyle.bannerFrom,
      bannerTo: brand?.secondary_color ?? defaultTextStyle.bannerTo,
    }),
    [brand],
  );


  // Load existing layout when contentId param is present
  useEffect(() => {
    const cid = searchParams.get("contentId");
    if (!cid) return;
    setContentId(cid);
    const load = async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, name, file_url, type")
        .eq("id", cid)
        .single();
      if (error || !data || data.type !== "layout" || !data.file_url) return;
      try {
        const base64 = data.file_url.replace(/^data:[^;]+;base64,/, "");
        const json = decodeURIComponent(escape(atob(base64)));
        const payload = JSON.parse(json);
        setContentName(payload.name || data.name);
        if (payload.orientation) setOrientation(payload.orientation);
        if (payload.width && payload.height) {
          setCustomResolution(true);
          setCustomW(payload.width);
          setCustomH(payload.height);
        }
        if (payload.background) setBackground(payload.background);
        if (Array.isArray(payload.layers)) setLayers(payload.layers);
      } catch (e) {
        console.error("Error loading layout:", e);
      }
    };
    load();
  }, [searchParams]);

  /**
   * "Adaptar en el editor" (`?adaptVideo=<id>&orientation=…`): abre el lienzo en
   * la orientación pedida con el video ya centrado, listo para ponerle fondo o
   * elementos a los lados.
   */
  useEffect(() => {
    const vid = searchParams.get("adaptVideo");
    if (!vid) return;
    const target: Orientation = searchParams.get("orientation") === "vertical" ? "portrait" : "landscape";
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("content")
        .select("id, name, file_url, thumbnail_url, width, height")
        .eq("id", vid)
        .maybeSingle();
      if (!alive || !data?.file_url) return;
      setOrientation(target);
      const canvas = target === "landscape" ? { w: 1920, h: 1080 } : { w: 1080, h: 1920 };
      const ar = data.width && data.height ? data.width / data.height : 16 / 9;
      // Encaja completo (contain), igual que el reproductor real.
      let w = canvas.w;
      let h = Math.round(canvas.w / ar);
      if (h > canvas.h) {
        h = canvas.h;
        w = Math.round(canvas.h * ar);
      }
      setContentName(`${data.name} (adaptado)`);
      setBackground("#000000");
      setLayers([
        {
          id: crypto.randomUUID(),
          name: data.name,
          type: "video" as LayerType,
          x: Math.round((canvas.w - w) / 2),
          y: Math.round((canvas.h - h) / 2),
          w,
          h,
          color: "#000000",
          videoUrl: data.file_url,
          imageUrl: data.thumbnail_url ?? undefined,
        },
      ]);
    })();
    return () => {
      alive = false;
    };
  }, [searchParams]);

  /** ¿Es del equipo de Visualia? Solo ellos crean o editan plantillas. */
  useEffect(() => {
    isPlatformAdmin().then(setEsAdminPlataforma).catch(() => setEsAdminPlataforma(false));
  }, []);

  /**
   * Abrir una plantilla (`?template=<id>`): se copia al lienzo. El fondo queda
   * bloqueado y solo se pueden tocar las capas que Visualia marcó como
   * editables. La plantilla original nunca se modifica.
   */
  useEffect(() => {
    const tid = searchParams.get("template");
    if (!tid) return;
    let vivo = true;
    (async () => {
      try {
        const [tpl, kit] = await Promise.all([fetchTemplate(tid), fetchBrandKit().catch(() => null)]);
        if (!vivo || !tpl) return;
        const horizontal = tpl.orientation !== "vertical";
        setPlantillaOrigen(tpl.id);
        setOrientation(horizontal ? "landscape" : "portrait");
        setCustomResolution(false);
        setContentName(tpl.name);
        setBackground("#000000");
        setLayers(documentToLayers(tpl.document, tpl.orientation, tpl.background_url, kit) as LayerItem[]);
        (tpl.document?.layers ?? []).forEach((l) => ensureFont(l.text?.fontFamily));
        setTab("settings");
      } catch (e) {
        console.error("plantilla:", e);
        toast.error("No pudimos abrir la plantilla");
      }
    })();
    return () => {
      vivo = false;
    };
  }, [searchParams]);

  /**
   * Panel de Visualia: crear una plantilla nueva sobre un fondo ya diseñado
   * (`?templateBg=<url>&orientation=…`).
   */
  useEffect(() => {
    const bg = searchParams.get("templateBg");
    if (!bg) return;
    const vertical = searchParams.get("orientation") === "vertical";
    const base = canvasFor(vertical ? "vertical" : "horizontal");
    setOrientation(vertical ? "portrait" : "landscape");
    setCustomResolution(false);
    setContentName(searchParams.get("templateName") || "Plantilla nueva");
    setTplForm((f) => ({
      ...f,
      name: searchParams.get("templateName") || "Plantilla nueva",
      business_type: searchParams.get("templateBusiness") || f.business_type,
      piece_type: searchParams.get("templatePiece") || f.piece_type,
    }));
    setLayers([
      {
        id: crypto.randomUUID(),
        name: "Fondo de la plantilla",
        type: "image",
        x: 0,
        y: 0,
        w: base.w,
        h: base.h,
        color: "#000000",
        imageUrl: bg,
        locked: true,
        templateLabel: "Fondo (no editable)",
      },
    ]);
  }, [searchParams]);

  const capasPlantilla = useMemo(
    () => layers.filter((l) => l.templateLabel && l.templateLabel !== "Fondo (no editable)" && !l.locked),
    [layers],
  );
  const enPlantilla = Boolean(plantillaOrigen) && capasPlantilla.length > 0;

  /**
   * El texto del cliente casi nunca mide lo mismo que el de la plantilla.
   * Se achica la letra hasta el 70 % del tamaño original; por debajo de eso
   * dejaría de leerse en el televisor y preferimos avisar.
   */
  const editarTextoPlantilla = useCallback((id: string, valor: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== id || !l.textStyle) return l;
        const base = l.baseFontSize ?? l.textStyle.fontSize;
        const { fontSize } = fitFontSize(valor, base, l.w, l.h, l.textStyle.fontFamily, l.textStyle.fontWeight);
        return { ...l, textStyle: { ...l.textStyle, content: valor, fontSize } };
      }),
    );
  }, []);

  const cambiarFotoPlantilla = useCallback(async (id: string, file: File) => {
    try {
      const url = await uploadTemplateAsset(file, file.name.replace(/[^\w.-]/g, "_"));
      setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, imageUrl: url } : l)));
    } catch (e: any) {
      toast.error("No pudimos subir la imagen: " + (e?.message ?? ""));
    }
  }, []);

  /** Guardar el lienzo actual como plantilla del catálogo (solo Visualia). */
  const guardarComoPlantilla = useCallback(async () => {
    const fondo = layers.find((l) => l.templateLabel === "Fondo (no editable)");
    if (!fondo?.imageUrl) {
      toast.error("La plantilla necesita un fondo. Creala desde Plantillas en el panel de Visualia.");
      return;
    }
    const orient = orientation === "portrait" ? "vertical" : "horizontal";
    const doc = layersToDocument(layers as any, orient, DEFAULT_SAFE_AREA);
    const { errores, avisos } = validateTemplateDocument(doc);
    if (errores.length) {
      toast.error(errores[0]);
      return;
    }
    avisos.forEach((a) => toast.warning(a));

    setSaving(true);
    try {
      setCapturing(true);
      const dataUrl = await captureElement(canvasRef.current, { scale: 0.25, backgroundColor: "#000000", type: "image/jpeg" });
      setCapturing(false);
      let thumb = fondo.imageUrl;
      if (dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        thumb = await uploadTemplateAsset(blob, "miniatura.jpg");
      }
      const id = await saveTemplate({
        id: esAdminPlataforma && searchParams.get("edit") === "1" ? plantillaOrigen ?? undefined : undefined,
        name: tplForm.name.trim() || contentName,
        business_type: tplForm.business_type,
        piece_type: tplForm.piece_type,
        orientation: orient,
        background_url: fondo.imageUrl,
        thumbnail_url: thumb,
        document: doc,
      });
      toast.success("Plantilla publicada en el catálogo");
      setTplDialogOpen(false);
      return id;
    } catch (e: any) {
      console.error(e);
      toast.error("No pudimos guardar la plantilla: " + (e?.message ?? ""));
    } finally {
      setCapturing(false);
      setSaving(false);
    }
  }, [layers, orientation, tplForm, contentName, plantillaOrigen, esAdminPlataforma, searchParams]);

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
        textStyle: isText ? brandTextStyle() : undefined,
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

  const tenant = useTenant();

  /** Colores de la marca aplicados a los elementos SVG monocromos. */
  const elementColors = useMemo(
    () => ({
      accent: brand?.accent_color ?? brand?.primary_color ?? DEFAULT_ELEMENT_COLORS.accent,
      primary: brand?.primary_color ?? DEFAULT_ELEMENT_COLORS.primary,
      secondary: brand?.secondary_color ?? DEFAULT_ELEMENT_COLORS.secondary,
    }),
    [brand],
  );

  /** Paleta de "Tu marca" para recolorear elementos y fondo. */
  const brandPalette = useMemo(
    () =>
      [
        { label: "Primario", value: brand?.primary_color ?? DEFAULT_ELEMENT_COLORS.primary },
        { label: "Secundario", value: brand?.secondary_color ?? DEFAULT_ELEMENT_COLORS.secondary },
        { label: "Acento", value: elementColors.accent },
        { label: "Fondo", value: brand?.background_color ?? "#FFFFFF" },
        { label: "Texto", value: brand?.text_color ?? "#111111" },
        { label: "Blanco", value: "#FFFFFF" },
        { label: "Negro", value: "#111111" },
        { label: "Rojo", value: "#EF4444" },
        { label: "Verde", value: "#22C55E" },
        { label: "Amarillo", value: "#FACC15" },
      ].filter((c, i, arr) => arr.findIndex((o) => o.value.toLowerCase() === c.value.toLowerCase()) === i),
    [brand, elementColors],
  );

  /** Recolorea un elemento SVG de la galería. */
  const recolorElement = useCallback((id: string, color: string) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id && l.svgTemplate
          ? {
              ...l,
              elementColor: color,
              imageUrl: toDataUri(l.svgTemplate, { accent: color, primary: color, secondary: color }),
            }
          : l,
      ),
    );
  }, []);

  /** Aplica un color de la paleta: a la capa seleccionada o al fondo del lienzo. */
  const applyPaletteColor = useCallback(
    (color: string) => {
      saveSnapshot();
      const target = layers.find((l) => l.id === selectedIds[0]);
      if (!target) {
        setBackground(color);
        return;
      }
      if (target.svgTemplate) {
        recolorElement(target.id, color);
        return;
      }
      if (target.type === "text" && target.textStyle) {
        updateLayerTextStyle(target.id, { ...target.textStyle, color });
        return;
      }
      setLayers((prev) => prev.map((l) => (l.id === target.id ? { ...l, color } : l)));
    },
    [layers, selectedIds, recolorElement, saveSnapshot],
  );

  /** Inserta un elemento de la galería curada (y su texto editable si es una insignia). */
  const addElementLayer = useCallback(
    (payload: ElementInsertPayload) => {
      saveSnapshot();
      const isBackground = payload.width >= baseResolution.w;
      const w = Math.min(payload.width, baseResolution.w);
      const h = Math.min(payload.height, baseResolution.h);
      const x = isBackground ? 0 : Math.round((baseResolution.w - w) / 2);
      const y = isBackground ? 0 : Math.round((baseResolution.h - h) / 2);
      const shapeId = crypto.randomUUID();
      const textId = crypto.randomUUID();

      const shapeLayer: LayerItem = {
        id: shapeId,
        name: payload.name,
        type: "image",
        x,
        y,
        w,
        h,
        color: "transparent",
        imageUrl: payload.url,
        svgTemplate: payload.svg,
        elementColor: payload.color,
      };

      const next: LayerItem[] = [shapeLayer];
      if (payload.text) {
        next.push({
          id: textId,
          name: payload.text,
          type: "text",
          x: x + Math.round(w * 0.1),
          y: y + Math.round(h / 2) - 40,
          w: Math.round(w * 0.8),
          h: 80,
          color: "transparent",
          textStyle: {
            ...brandTextStyle(),
            content: payload.text,
            fontSize: payload.textSize ?? 54,
            fontWeight: 800,
            color: "#FFFFFF",
            textAlign: "center",
            bannerStyle: "none",
            paddingX: 0,
            paddingY: 0,
          },
        });
      }

      setLayers((prev) => (isBackground ? [...next, ...prev] : [...prev, ...next]));
      setSelectedIds([payload.text ? textId : shapeId]);
      setElementsPanelOpen(false);
    },
    [baseResolution, brandTextStyle, saveSnapshot],
  );



  const addLocalImageLayer = (file: File) => {
    const src = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      saveSnapshot();
      const maxW = 420;
      const s = Math.min(1, maxW / img.width);
      const id = crypto.randomUUID();
      setLayers((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          type: "image" as LayerType,
          x: 100 + prev.length * 20,
          y: 100 + prev.length * 20,
          w: Math.round(img.width * s),
          h: Math.round(img.height * s),
          color: "transparent",
          imageUrl: src,
        },
      ]);
      setSelectedIds([id]);
    };
    img.src = src;
  };

  const onPickLocalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((f) => {
      if (f.type.startsWith("image/")) addLocalImageLayer(f);
    });
    e.target.value = "";
  };

  const onPickVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingVideo(true);
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("No auth");
      const bizId = await getBusinessId();
      if (!bizId) throw new Error("No business");
      const ext = file.name.split(".").pop();
      const filePath = `${bizId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(filePath, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Also save to content table
      await supabase.from("content").insert({
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: "video",
        file_url: publicUrl,
        business_id: bizId,
      });

      // Add video layer
      saveSnapshot();
      const id = crypto.randomUUID();
      setLayers((prev) => [
        ...prev,
        {
          id,
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: "video" as LayerType,
          x: 100 + prev.length * 20,
          y: 100 + prev.length * 20,
          w: 640,
          h: 360,
          color: "transparent",
          videoUrl: publicUrl,
        },
      ]);
      setSelectedIds([id]);
      toast.success("Video agregado al canvas");
    } catch (err: any) {
      toast.error(err?.message || "Error al subir video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const swapLayers = useCallback((i: number, j: number) => {
    if (i < 0 || j < 0 || i >= layers.length || j >= layers.length) return;
    saveSnapshot();
    setLayers((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, [layers.length, saveSnapshot]);

  const bringForward = useCallback(() => {
    if (!selectedLayer) return;
    const idx = layers.findIndex((l) => l.id === selectedLayer.id);
    swapLayers(idx, idx + 1);
  }, [selectedLayer, layers, swapLayers]);

  const sendBackward = useCallback(() => {
    if (!selectedLayer) return;
    const idx = layers.findIndex((l) => l.id === selectedLayer.id);
    swapLayers(idx, idx - 1);
  }, [selectedLayer, layers, swapLayers]);

  const bringToFront = useCallback(() => {
    if (!selectedLayer) return;
    saveSnapshot();
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === selectedLayer.id);
      if (idx < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
  }, [selectedLayer, saveSnapshot]);

  const sendToBack = useCallback(() => {
    if (!selectedLayer) return;
    saveSnapshot();
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === selectedLayer.id);
      if (idx < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }, [selectedLayer, saveSnapshot]);

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
    if (layers.find((l) => l.id === id)?.locked) return;
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
    if (!layer || layer.locked) return;
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
        if (!layer || layer.locked) return prev;
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
        selectedSet.has(l.id) && !l.locked ? { ...l, x: l.x + dx, y: l.y + dy } : l
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
    setLayers((prev) => prev.map((l) => (l.id === id && !l.locked ? { ...l, w, h } : l)));
  };

  const handleResizeEnd = useCallback(() => {
    dragSnapshotSaved.current = false;
  }, []);

  const handleDoubleClick = useCallback((id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer?.type === "text") {
      setEditingLayerId(id);
      requestAnimationFrame(() => textareaRef.current?.focus());
    } else if (layer?.type === "widget") {
      setEditingLayerId(id);
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
    setLayers((prev) => prev.filter((l) => !(selectedSet.has(l.id) && !l.locked)));
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

  const buildLayoutPayload = useCallback(() => ({
    name: contentName,
    orientation,
    width: baseResolution.w,
    height: baseResolution.h,
    background,
    layers: layers.map((l) => ({ ...l })),
  }), [contentName, orientation, baseResolution, background, layers]);

  const onSaveContent = useCallback(async () => {
    setSaveFileName(contentName);
    setSaveDialogOpen(true);
  }, [contentName]);

  /**
   * Dispara la generación de la miniatura en el servidor (satori + resvg).
   * Es asíncrona a propósito: el usuario no espera a que termine.
   */
  const requestThumbnail = useCallback((id: string) => {
    supabase.functions
      .invoke("render-thumbnail", { body: { content_id: id } })
      .catch((e) => console.warn("render-thumbnail:", e));
  }, []);

  const confirmSaveContent = useCallback(async () => {
    if (!saveFileName.trim()) return;
    setSaving(true);
    try {
      const bizId = await getBusinessId();
      if (!bizId) { toast.error("No estás asociado a un negocio"); return; }

      const payload = buildLayoutPayload();
      const layoutJson = JSON.stringify({ ...payload, name: saveFileName.trim() });
      const dataUri = `data:application/json;base64,${btoa(unescape(encodeURIComponent(layoutJson)))}`;

      let savedId = contentId;
      if (contentId) {
        // La miniatura se regenera en cada guardado: una desactualizada
        // hace que el usuario elija la pieza equivocada.
        const { error } = await supabase.from("content").update({
          name: saveFileName.trim(),
          file_url: dataUri,
          thumbnail_url: null,
          thumbnail_status: "pendiente",
        }).eq("id", contentId);
        if (error) throw error;
      } else {
        const { data: inserted, error: insertError } = await supabase.from("content").insert({
          name: saveFileName.trim(),
          type: "layout",
          file_url: dataUri,
          thumbnail_status: "pendiente",
          business_id: bizId,
          created_by: await getUserId(),
        }).select("id").single();
        if (insertError) throw insertError;
        if (inserted) { setContentId(inserted.id); savedId = inserted.id; }
      }

      if (savedId) requestThumbnail(savedId);

      setContentName(saveFileName.trim());
      setLastSavedAt(Date.now());
      setDirty(false);
      toast.success(`"${saveFileName.trim()}" guardado en Contenido`);
      setSaveDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Error al guardar: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  }, [saveFileName, buildLayoutPayload, contentId, requestThumbnail]);


  // Presets: fetch on mount
  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    const { data } = await supabase
      .from("content")
      .select("id, name, thumbnail_url, file_url")
      .eq("type", "preset")
      .order("created_at", { ascending: false });
    setPresets(data ?? []);
  };

  const onSavePreset = useCallback(async () => {
    setPresetName(contentName + " (preset)");
    setPresetDialogOpen(true);
  }, [contentName]);

  const confirmSavePreset = useCallback(async () => {
    if (!presetName.trim()) return;
    setSaving(true);
    try {
      const bizId = await getBusinessId();
      if (!bizId) { toast.error("No estás asociado a un negocio"); return; }

      const payload = buildLayoutPayload();
      const layoutJson = JSON.stringify({ ...payload, name: presetName.trim() });
      const dataUri = `data:application/json;base64,${btoa(unescape(encodeURIComponent(layoutJson)))}`;

      const { data: inserted, error } = await supabase.from("content").insert({
        name: presetName.trim(),
        type: "preset",
        file_url: dataUri,
        thumbnail_status: "pendiente",
        business_id: bizId,
        created_by: await getUserId(),
      }).select("id").single();
      if (error) throw error;
      if (inserted) requestThumbnail(inserted.id);

      setLastSavedAt(Date.now());
      setDirty(false);
      toast.success(`Preset "${presetName.trim()}" guardado`);
      setPresetDialogOpen(false);
      setTab("presets");
      fetchPresets();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al guardar preset: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  }, [presetName, buildLayoutPayload, requestThumbnail]);


  const loadPreset = useCallback(async (preset: { file_url: string | null }) => {
    if (!preset.file_url) return;
    try {
      const base64 = preset.file_url.replace(/^data:[^;]+;base64,/, "");
      const json = decodeURIComponent(escape(atob(base64)));
      const payload = JSON.parse(json);
      saveSnapshot();
      if (payload.orientation) setOrientation(payload.orientation);
      if (payload.width && payload.height) {
        setCustomResolution(true);
        setCustomW(payload.width);
        setCustomH(payload.height);
      }
      if (payload.background) setBackground(payload.background);
      if (Array.isArray(payload.layers)) setLayers(payload.layers);
      toast.success("Preset aplicado");
    } catch (e) {
      console.error("Error loading preset:", e);
      toast.error("No se pudo cargar el preset");
    }
  }, [saveSnapshot]);

  /**
   * Abrir una plantilla de "Tu marca" (`?preset=<id>`): trae la estructura y le
   * aplica los colores y tipografías de la marca. La plantilla guarda la
   * estructura, nunca el contenido.
   */
  useEffect(() => {
    const pid = searchParams.get("preset");
    if (!pid || !brand) return;
    let vivo = true;
    (async () => {
      const { data } = await supabase
        .from("content")
        .select("file_url")
        .eq("id", pid)
        .eq("type", "preset")
        .maybeSingle();
      if (!vivo || !data?.file_url) return;
      try {
        const base64 = data.file_url.replace(/^data:[^;]+;base64,/, "");
        const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
        if (payload.orientation) setOrientation(payload.orientation);
        if (payload.width && payload.height) {
          setCustomResolution(true);
          setCustomW(payload.width);
          setCustomH(payload.height);
        }
        setBackground(brand.background_color);
        if (Array.isArray(payload.layers)) {
          setLayers(
            (payload.layers as LayerItem[]).map((l) =>
              l.type === "text" && l.textStyle
                ? {
                    ...l,
                    textStyle: {
                      ...l.textStyle,
                      fontFamily:
                        l.textStyle.fontSize >= 40
                          ? brand.heading_font ?? l.textStyle.fontFamily
                          : brand.body_font ?? l.textStyle.fontFamily,
                      color: brand.text_color,
                      bannerColor: brand.primary_color,
                      bannerFrom: brand.primary_color,
                      bannerTo: brand.secondary_color,
                    },
                  }
                : l,
            ),
          );
        }
        toast.success("Plantilla abierta con los colores de tu marca");
      } catch {
        toast.error("No se pudo abrir la plantilla");
      }
    })();
    return () => {
      vivo = false;
    };
  }, [searchParams, brand]);



  const deletePreset = useCallback(async (id: string) => {
    const { error } = await supabase.from("content").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar preset");
    } else {
      setPresets((prev) => prev.filter((p) => p.id !== id));
      toast.success("Preset eliminado");
    }
  }, []);

  return (
    <div className="h-full w-full bg-muted text-foreground" tabIndex={0} onKeyDown={onKeyDown} style={{ outline: "none" }}>
      <EditorTopBar
        contentName={contentName}
        onSaveContent={onSaveContent}
        onSavePreset={onSavePreset}
        saving={saving}
        capturing={capturing}
        lastSavedAt={lastSavedAt}
        dirty={dirty}
      />

      <div className="grid h-[calc(100%-56px)] grid-cols-[56px_1fr_320px]">
        {/* Left tools */}
         <aside className="border-r border-border bg-card p-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-center gap-2 pb-1">
              <img
                src={simboloVisualia}
                alt="Visualia"
                width={20}
                height={20}
                style={{ height: 20, width: "auto" }}
                className="shrink-0 drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              />
              <span className="h-px w-full bg-border" />
            </div>
            <button onClick={() => addLayer("Zona", "zone")} className="rounded-lg p-2 hover:bg-primary/10 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)] transition-all duration-200 text-muted-foreground hover:text-primary" title="Zona">
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button onClick={() => addLayer("Texto", "text")} className="rounded-lg p-2 hover:bg-primary/10 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)] transition-all duration-200 text-muted-foreground hover:text-primary" title="Texto">
              <Type className="h-5 w-5" />
            </button>
            <Popover open={imageGalleryOpen} onOpenChange={setImageGalleryOpen}>
              <PopoverTrigger asChild>
                <button className="rounded-lg p-2 hover:bg-primary/10 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)] transition-all duration-200 text-muted-foreground hover:text-primary" title="Imagen">
                  <ImageIcon className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-auto p-0 border-0 bg-transparent shadow-none">
                <ImageGalleryMenu onInsertImage={addImageLayer} />
              </PopoverContent>
            </Popover>
            <Popover open={widgetPickerOpen} onOpenChange={setWidgetPickerOpen}>
              <PopoverTrigger asChild>
                <button className="rounded-lg p-2 hover:bg-primary/10 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)] transition-all duration-200 text-muted-foreground hover:text-primary" title="Widget">
                  <Star className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-72 p-0 border-0 bg-transparent shadow-none">
                <WidgetPresetPicker orientation={orientation} onInsertPreset={addWidgetFromPreset} />
              </PopoverContent>
            </Popover>
            <Popover open={elementsPanelOpen} onOpenChange={setElementsPanelOpen}>
              <PopoverTrigger asChild>
                <button className="rounded-lg p-2 hover:bg-primary/10 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)] transition-all duration-200 text-muted-foreground hover:text-primary" title="Elementos">
                  <Shapes className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-auto p-0 border-0 bg-transparent shadow-none">
                <ElementsPanel
                  colors={elementColors}
                  businessCategory={tenant.category}
                  onInsert={addElementLayer}
                />
              </PopoverContent>
            </Popover>
            <span className="h-px w-full bg-border" />
            <button onClick={() => fileInputRef.current?.click()} className="rounded-lg p-2 hover:bg-primary/10 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)] transition-all duration-200 text-muted-foreground hover:text-primary" title="Subir imagen (PNG)">
              <Upload className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={onPickLocalFiles}
            />
            <button
              onClick={() => videoInputRef.current?.click()}
              className="rounded-lg p-2 hover:bg-primary/10 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)] transition-all duration-200 text-muted-foreground hover:text-primary relative"
              title="Subir video"
              disabled={uploadingVideo}
            >
              {uploadingVideo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Film className="h-5 w-5" />}
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              hidden
              onChange={onPickVideoFile}
            />
            <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir paleta de tu marca"
                  aria-expanded={paletteOpen}
                  className={cn(
                    "rounded-lg p-2 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]",
                    paletteOpen ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                  title="Paleta de tu marca"
                >
                  <Palette className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" sideOffset={8} collisionPadding={12} className="w-64 space-y-3 p-3">
                <p className="text-sm font-semibold text-foreground">Paleta de tu marca</p>
                <p className="text-xs text-muted-foreground">
                  {selectedLayer
                    ? `Aplicar color a “${selectedLayer.name}”`
                    : "Sin capa seleccionada: se aplica al fondo del lienzo"}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {brandPalette.map((c) => (
                    <button
                      key={c.value + c.label}
                      onClick={() => applyPaletteColor(c.value)}
                      title={c.label}
                      className="h-9 w-full rounded-md border border-border transition-transform hover:scale-105"
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
                <label className="block text-xs text-muted-foreground">Color personalizado</label>
                <input
                  type="color"
                  value={selectedLayer?.elementColor ?? background}
                  onChange={(e) => applyPaletteColor(e.target.value)}
                  className="h-9 w-full rounded border border-border p-1"
                />
              </PopoverContent>
            </Popover>
          </div>
        </aside>

        {/* Center canvas */}
        <main className="relative flex flex-col bg-muted min-w-0 overflow-hidden">
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
              <button onClick={undo} className="rounded-lg border border-border bg-card px-2 py-1 hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_10px_-2px_hsl(var(--primary)/0.35)] transition-all duration-200" title="Deshacer (Ctrl+Z)">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={redo} className="rounded-lg border border-border bg-card px-2 py-1 hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_10px_-2px_hsl(var(--primary)/0.35)] transition-all duration-200" title="Rehacer (Ctrl+Shift+Z)">
                <Redo2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(25, z - 25))}
                className="rounded-lg border border-border bg-card px-2 py-1 hover:bg-primary/10 hover:border-primary/30 transition-all"
                title="Alejar"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="rounded-lg border border-border bg-card px-2 py-1 text-sm hover:border-primary/30 focus:border-primary/40 focus:shadow-[0_0_10px_-2px_hsl(var(--primary)/0.3)] transition-all duration-200"
              >
                {[25, 50, 75, 100, 125, 150, 200, 300].map((z) => (
                  <option key={z} value={z}>
                    {z}%
                  </option>
                ))}
              </select>
              <button
                onClick={() => setZoom((z) => Math.min(300, z + 25))}
                className="rounded-lg border border-border bg-card px-2 py-1 hover:bg-primary/10 hover:border-primary/30 transition-all"
                title="Ampliar"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPanMode((v) => !v)}
                className={cn(
                  "rounded-lg border px-2 py-1 transition-all",
                  panMode
                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_10px_-2px_hsl(var(--primary)/0.5)]"
                    : "border-border bg-card hover:bg-primary/10 hover:border-primary/30"
                )}
                title="Mano — arrastra para desplazar el lienzo (mantén Espacio)"
              >
                <Hand className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable canvas area */}
          <div
            ref={scrollAreaRef}
            className={cn(
              "flex-1 overflow-auto p-6",
              panMode && (isPanning ? "cursor-grabbing" : "cursor-grab")
            )}
            onMouseDown={onPanMouseDown}
            onMouseMove={onPanMouseMove}
            onMouseUp={onPanMouseUp}
            onMouseLeave={onPanMouseUp}
          >
            <div
              ref={stageWrapRef}
              className="inline-block"
              style={{
                width: baseResolution.w * scale,
                height: baseResolution.h * scale,
                minWidth: baseResolution.w * scale,
                minHeight: baseResolution.h * scale,
                pointerEvents: panMode ? "none" : "auto",
              }}
            >
              <div
                ref={canvasRef}
                style={{
                  ...stageStyle,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  boxShadow: "0 0 60px 12px hsl(var(--primary) / 0.4), 0 0 120px 40px hsl(var(--primary) / 0.2), 0 0 200px 60px hsl(var(--primary) / 0.08)",
                }}
                className="relative overflow-hidden rounded-lg border border-primary/40"
                onClick={handleCanvasClick}
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
              >
              {/* Marca de agua: solo mientras el lienzo está vacío */}
              {layers.length === 0 && (
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                  <img
                    src={simboloVisualia}
                    alt=""
                    aria-hidden
                    style={{ width: 200, height: "auto", opacity: 0.06 }}
                    draggable={false}
                  />
                </div>
              )}
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
                    locked={l.locked}
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
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          "h-full w-full rounded",
                          l.expects === "recorte" ? "object-contain" : "object-cover",
                        )}
                        draggable={false}
                      />
                    ) : l.type === "video" && l.videoUrl ? (
                      <video
                        src={l.videoUrl}
                        className="h-full w-full object-cover rounded"
                        muted
                        loop
                        autoPlay
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
                        onUpdateContent={(nextContent) => {
                          saveSnapshot();
                          setLayers((prev) =>
                            prev.map((ly) =>
                              ly.id === l.id ? { ...ly, widgetData: nextContent } : ly
                            )
                          );
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
              { id: "settings" as const, label: "Ajustes", icon: Settings },
              { id: "layers" as const, label: "Capas", icon: Layers },
              { id: "presets" as const, label: "Presets", icon: BookmarkPlus },
              { id: "actions" as const, label: "Acciones", icon: PlaySquare },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 px-3 py-2 transition-all duration-200 ${
                  tab === id
                    ? "border-b-2 border-primary font-semibold text-foreground shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                }`}
              >
                <Icon className="mr-1 inline h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {tab === "settings" && (
            <div className="space-y-4 p-4 text-sm">
              {enPlantilla && (
                <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">Contenido de la plantilla</p>
                    <p className="text-xs text-muted-foreground">
                      Cambiá los textos y las fotos. El diseño de fondo queda fijo.
                    </p>
                  </div>
                  {capasPlantilla.map((l) => (
                    <div key={l.id} className="space-y-1">
                      <label className="text-xs font-medium text-foreground">{l.templateLabel}</label>
                      {l.type === "text" && l.textStyle ? (
                        <>
                          <textarea
                            value={l.textStyle.content}
                            onChange={(e) => editarTextoPlantilla(l.id, e.target.value)}
                            rows={l.templateKind === "precio" ? 1 : 2}
                            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          {l.maxChars && l.textStyle.content.length > l.maxChars && (
                            <p className="text-[11px] text-amber-400">
                              Va largo para este espacio: probá con {l.maxChars} caracteres o menos.
                            </p>
                          )}
                          {l.baseFontSize && l.textStyle.fontSize <= Math.round(l.baseFontSize * 0.7) && (
                            <p className="text-[11px] text-amber-400">
                              Achicamos la letra al mínimo legible. Si acortás el texto, se ve mejor.
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) cambiarFotoPlantilla(l.id, f);
                            }}
                            className="w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:text-primary"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            {l.expects === "recorte"
                              ? "Subí el producto sin fondo (PNG): se muestra completo."
                              : "Subí una foto: se recorta para llenar el espacio."}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {esAdminPlataforma && layers.some((l) => l.templateLabel === "Fondo (no editable)") && (
                <button
                  {...preloadCapture()}
                  onClick={() => {
                    setTplForm((f) => ({ ...f, name: f.name || contentName }));
                    setTplDialogOpen(true);
                  }}
                  className="w-full rounded border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  Publicar como plantilla de Visualia
                </button>
              )}

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
                  <div>
                    <label className="mb-1 block text-muted-foreground text-xs">Orden de capas</label>
                    <div className="flex gap-1">
                      <button onClick={bringToFront} className="flex-1 rounded border border-border px-2 py-1.5 text-xs hover:bg-accent" title="Traer al frente">
                        <ChevronsUp className="mx-auto h-3.5 w-3.5" />
                      </button>
                      <button onClick={bringForward} className="flex-1 rounded border border-border px-2 py-1.5 text-xs hover:bg-accent" title="Adelantar 1">
                        <ArrowUp className="mx-auto h-3.5 w-3.5" />
                      </button>
                      <button onClick={sendBackward} className="flex-1 rounded border border-border px-2 py-1.5 text-xs hover:bg-accent" title="Atrasar 1">
                        <ArrowDown className="mx-auto h-3.5 w-3.5" />
                      </button>
                      <button onClick={sendToBack} className="flex-1 rounded border border-border px-2 py-1.5 text-xs hover:bg-accent" title="Enviar al fondo">
                        <ChevronsDown className="mx-auto h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {selectedLayer.svgTemplate && (
                    <div>
                      <label className="mb-1 block text-muted-foreground text-xs">Color del elemento</label>
                      <div className="mb-2 grid grid-cols-5 gap-1.5">
                        {brandPalette.map((c) => (
                          <button
                            key={c.value + c.label}
                            onClick={() => recolorElement(selectedLayer.id, c.value)}
                            title={c.label}
                            className="h-7 w-full rounded border border-border transition-transform hover:scale-105"
                            style={{ background: c.value }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={selectedLayer.elementColor ?? elementColors.accent}
                        onChange={(e) => recolorElement(selectedLayer.id, e.target.value)}
                        className="h-9 w-full rounded border border-border p-1"
                      />
                    </div>
                  )}
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
                        aria-pressed={orientation === "landscape"}
                        className="v-seg-item rounded border border-border px-2 py-1.5"
                      >
                        Horizontal
                      </button>
                      <button
                        onClick={() => setOrientation("portrait")}
                        aria-pressed={orientation === "portrait"}
                        className="v-seg-item rounded border border-border px-2 py-1.5"
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
                              <img src={l.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" draggable={false} />
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

          {tab === "presets" && (
            <div className="space-y-3 p-4">
              <p className="text-xs text-muted-foreground">
                Presets guardados. Haz clic en uno para aplicarlo al canvas.
              </p>
              {presets.length === 0 ? (
                <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  <BookmarkPlus className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Aún no hay presets guardados
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((p) => (
                    <div key={p.id} className="group relative rounded-lg border border-border overflow-hidden hover:border-primary transition-colors cursor-pointer">
                      <div
                        className="aspect-video bg-secondary/50 flex items-center justify-center"
                        onClick={() => loadPreset(p)}
                      >
                        {p.thumbnail_url ? (
                          <img src={storageThumb(p.thumbnail_url, { width: 240 })} alt={p.name} width={240} height={135} loading="lazy" decoding="async" style={{ aspectRatio: "16 / 9" }} className="h-full w-full object-cover" />
                        ) : (
                          <LayoutGrid className="h-6 w-6 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="p-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium truncate">{p.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }}
                          className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-destructive/10 text-destructive transition-opacity"
                          title="Eliminar preset"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Save to Content dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar en Contenido</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm text-muted-foreground">Nombre del archivo</label>
            <input
              autoFocus
              value={saveFileName}
              onChange={(e) => setSaveFileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmSaveContent(); }}
              placeholder="Ej: Menú almuerzo lunes"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setSaveDialogOpen(false)}
              className="rounded border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              {...preloadCapture()}
              onClick={confirmSaveContent}
              disabled={saving || !saveFileName.trim()}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                {(saving || capturing) && <Loader2 className="h-4 w-4 animate-spin" />}
                {capturing ? "Generando vista previa…" : saving ? "Guardando…" : "Guardar"}
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Preset dialog */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar como preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm text-muted-foreground">Nombre del preset</label>
            <input
              autoFocus
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmSavePreset(); }}
              placeholder="Ej: Menú restaurante premium"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setPresetDialogOpen(false)}
              className="rounded border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              {...preloadCapture()}
              onClick={confirmSavePreset}
              disabled={saving || !presetName.trim()}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                {(saving || capturing) && <Loader2 className="h-4 w-4 animate-spin" />}
                {capturing ? "Generando vista previa…" : saving ? "Guardando…" : "Guardar preset"}
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publicar plantilla (equipo Visualia) */}
      <Dialog open={tplDialogOpen} onOpenChange={setTplDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publicar como plantilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nombre</label>
              <input
                autoFocus
                value={tplForm.name}
                onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tipo de negocio</label>
              <select
                value={tplForm.business_type}
                onChange={(e) => setTplForm({ ...tplForm, business_type: e.target.value })}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                {BUSINESS_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tipo de pieza</label>
              <select
                value={tplForm.piece_type}
                onChange={(e) => setTplForm({ ...tplForm, piece_type: e.target.value })}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                {PIECE_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Las posiciones se guardan en proporciones, así la plantilla sirve en cualquier televisor.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => setTplDialogOpen(false)}
              className="rounded border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              onClick={guardarComoPlantilla}
              disabled={saving || !tplForm.name.trim()}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                {(saving || capturing) && <Loader2 className="h-4 w-4 animate-spin" />}
                {capturing ? "Generando miniatura…" : saving ? "Publicando…" : "Publicar"}
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
