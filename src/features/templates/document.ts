/**
 * Conversión entre el documento de plantilla (fracciones) y las capas del
 * editor (píxeles sobre la resolución base), validación y ajuste automático
 * de tipografía.
 */
import { defaultTextStyle, type TextStyle } from "@/components/editor/EditorTextTools";
import { measureText } from "@/lib/textMetrics";
import type { BrandKit } from "@/features/brand/api";
import {
  MIN_TEXT_SIZE,
  canvasFor,
  type TemplateDocument,
  type TemplateLayer,
} from "./types";

/** Forma mínima de una capa del editor (evita importar EditorPage). */
export interface EditorLayerLike {
  id: string;
  name: string;
  type: "zone" | "text" | "image" | "widget" | "video";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  textStyle?: TextStyle;
  imageUrl?: string;
  videoUrl?: string;

  /** Plantillas: la capa no se mueve, no se borra, no se redimensiona. */
  locked?: boolean;
  /** Nombre en cristiano para el panel "Contenido" del editor. */
  templateLabel?: string;
  templateKind?: TemplateLayer["kind"];
  /** "foto" (se recorta al marco) o "recorte" (PNG sin fondo, entero). */
  expects?: "foto" | "recorte";
  maxChars?: number;
  /** Tamaño original de la plantilla: el auto-ajuste nunca baja del 70 %. */
  baseFontSize?: number;
}

function brandColorOf(kit: BrandKit | null, key?: string, fallback = "#FFFFFF") {
  if (!kit || !key) return fallback;
  switch (key) {
    case "primary": return kit.primary_color || fallback;
    case "secondary": return kit.secondary_color || fallback;
    case "accent": return kit.accent_color || kit.primary_color || fallback;
    case "text": return kit.text_color || fallback;
    default: return fallback;
  }
}

/** Documento de plantilla → capas del editor, ya en píxeles. */
export function documentToLayers(
  doc: TemplateDocument,
  orientation: string,
  backgroundUrl: string,
  brand: BrandKit | null,
): EditorLayerLike[] {
  const base = canvasFor(orientation);
  const esVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(backgroundUrl ?? "");

  const fondo: EditorLayerLike = {
    id: crypto.randomUUID(),
    name: "Fondo de la plantilla",
    type: esVideo ? "video" : "image",
    x: 0,
    y: 0,
    w: base.w,
    h: base.h,
    color: "#000000",
    imageUrl: esVideo ? undefined : backgroundUrl,
    videoUrl: esVideo ? backgroundUrl : undefined,
    locked: true,
    templateLabel: "Fondo (no editable)",
  };

  const capas = (doc.layers ?? []).map<EditorLayerLike>((l) => {
    const x = Math.round(l.x * base.w);
    const y = Math.round(l.y * base.h);
    const w = Math.max(24, Math.round(l.w * base.w));
    const h = Math.max(24, Math.round(l.h * base.h));

    if (l.kind === "foto" || l.kind === "logo") {
      return {
        id: crypto.randomUUID(),
        name: l.label,
        type: "image",
        x, y, w, h,
        color: "#00000000",
        imageUrl: l.kind === "logo" ? brand?.logo_url ?? l.image?.url : l.image?.url,
        locked: !l.editable,
        templateLabel: l.label,
        templateKind: l.kind,
        expects: l.image?.expects ?? "foto",
      };
    }

    const spec = l.text;
    const fontSize = Math.round((spec?.size ?? MIN_TEXT_SIZE) * base.h);
    const textStyle: TextStyle = {
      ...defaultTextStyle,
      content: spec?.value ?? l.label,
      fontFamily: spec?.fontFamily ?? defaultTextStyle.fontFamily,
      fontSize,
      fontWeight: (spec?.weight ?? 700) as TextStyle["fontWeight"],
      color: spec?.brandColor
        ? brandColorOf(brand, spec.brandColor, spec.color)
        : spec?.color ?? "#FFFFFF",
      lineHeight: spec?.lineHeight ?? 1.15,
      textAlign: spec?.align ?? "left",
      paddingX: 0,
      paddingY: 0,
      bannerStyle: "none",
    };

    return {
      id: crypto.randomUUID(),
      name: l.label,
      type: "text",
      x, y, w, h,
      color: "#00000000",
      textStyle,
      locked: !l.editable,
      templateLabel: l.label,
      templateKind: l.kind,
      maxChars: spec?.maxChars,
      baseFontSize: fontSize,
    };
  });

  return [fondo, ...capas];
}

/** Capas del editor → documento de plantilla (lo usa el panel de Visualia). */
export function layersToDocument(
  layers: EditorLayerLike[],
  orientation: string,
  safeArea: number,
): TemplateDocument {
  const base = canvasFor(orientation);
  return {
    version: 1,
    canvas: { ratio: base.w / base.h, safeArea },
    layers: layers
      .filter((l) => !(l.templateLabel === "Fondo (no editable)"))
      .map<TemplateLayer>((l) => {
        const comun = {
          id: l.id,
          label: l.templateLabel || l.name,
          editable: !l.locked,
          x: +(l.x / base.w).toFixed(4),
          y: +(l.y / base.h).toFixed(4),
          w: +(l.w / base.w).toFixed(4),
          h: +(l.h / base.h).toFixed(4),
        };
        if (l.type === "image") {
          return {
            ...comun,
            kind: l.templateKind === "logo" ? "logo" : "foto",
            image: {
              url: l.imageUrl,
              fit: l.expects === "recorte" ? "contain" : "cover",
              expects: l.expects ?? "foto",
            },
          };
        }
        const s = l.textStyle ?? defaultTextStyle;
        return {
          ...comun,
          kind: l.templateKind === "precio" ? "precio" : "texto",
          text: {
            value: s.content,
            fontFamily: s.fontFamily,
            size: +(s.fontSize / base.h).toFixed(4),
            weight: s.fontWeight,
            color: s.color,
            align: (s.textAlign === "justify" ? "left" : s.textAlign) as "left" | "center" | "right",
            lineHeight: s.lineHeight,
            maxChars: l.maxChars,
          },
        };
      }),
  };
}

export interface TemplateValidation {
  errores: string[];
  avisos: string[];
}

/** Nadie publica una plantilla que no se lee o se sale del televisor. */
export function validateTemplateDocument(doc: TemplateDocument): TemplateValidation {
  const errores: string[] = [];
  const avisos: string[] = [];
  const sa = doc.canvas?.safeArea ?? 0;

  if (!doc.layers?.length) errores.push("La plantilla no tiene ninguna capa editable.");

  doc.layers?.forEach((l) => {
    const fueraIzq = l.x < sa;
    const fueraArr = l.y < sa;
    const fueraDer = l.x + l.w > 1 - sa;
    const fueraAba = l.y + l.h > 1 - sa;
    if (fueraIzq || fueraArr || fueraDer || fueraAba) {
      avisos.push(`"${l.label}" se sale del margen de seguridad: en algunos televisores queda cortada.`);
    }
    if ((l.kind === "texto" || l.kind === "precio") && (l.text?.size ?? 0) < MIN_TEXT_SIZE) {
      errores.push(`"${l.label}" tiene una letra demasiado pequeña para leerse a cuatro metros.`);
    }
    if (l.x < 0 || l.y < 0 || l.x + l.w > 1.0001 || l.y + l.h > 1.0001) {
      errores.push(`"${l.label}" queda fuera del lienzo.`);
    }
  });

  return { errores, avisos };
}

/**
 * Si el texto del cliente no cabe, se achica la letra hasta el 70 % del tamaño
 * original. Por debajo de eso ya no se lee: mejor avisar que deformar la pieza.
 */
export function fitFontSize(
  content: string,
  baseFontSize: number,
  boxW: number,
  boxH: number,
  fontFamily: string,
  weight: number,
): { fontSize: number; cabe: boolean } {
  const minimo = Math.round(baseFontSize * 0.7);
  const lineas = content.split("\n").filter(Boolean);
  for (let size = baseFontSize; size >= minimo; size -= 2) {
    const anchoMax = Math.max(...lineas.map((t) => measureText(t, size, fontFamily, weight)), 0);
    const alto = lineas.length * size * 1.2;
    if (anchoMax <= boxW && alto <= boxH) return { fontSize: size, cabe: true };
  }
  return { fontSize: minimo, cabe: false };
}
