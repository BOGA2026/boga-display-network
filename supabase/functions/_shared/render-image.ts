/**
 * Renderizador de imágenes del lado del servidor (satori + resvg).
 *
 * Módulo compartido: lo usan la generación de miniaturas de diseños
 * (`render-thumbnail`) y el generador de menús con IA. Toma un árbol tipo JSX
 * (objetos planos, sin JSX para poder vivir en un .ts) y devuelve un PNG.
 *
 * No usamos html2canvas del lado del cliente: depende del navegador abierto,
 * es frágil con fuentes y no sirve para trabajos en lote.
 */

import satori from "npm:satori@0.10.13";
import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.2";

const RESVG_WASM = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

const FONTS = [
  { name: "Inter", weight: 400, url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff" },
  { name: "Inter", weight: 700, url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-700-normal.woff" },
] as const;

// deno-lint-ignore no-explicit-any
export type Node = { type: string; props: Record<string, any> };

let wasmReady: Promise<void> | null = null;
// deno-lint-ignore no-explicit-any
let fontsCache: any[] | null = null;

async function ensureWasm() {
  if (!wasmReady) {
    wasmReady = fetch(RESVG_WASM)
      .then((r) => r.arrayBuffer())
      .then((buf) => initWasm(buf))
      .catch((e) => {
        wasmReady = null;
        throw e;
      });
  }
  return wasmReady;
}

async function ensureFonts() {
  if (fontsCache) return fontsCache;
  fontsCache = await Promise.all(
    FONTS.map(async (f) => ({
      name: f.name,
      weight: f.weight,
      style: "normal" as const,
      data: await fetch(f.url).then((r) => r.arrayBuffer()),
    })),
  );
  return fontsCache;
}

/** Renderiza un árbol de nodos a PNG. `width` es el ancho final en píxeles. */
export async function renderNodeToPng(
  node: Node,
  opts: { width: number; height: number; outputWidth?: number },
): Promise<Uint8Array> {
  const fonts = await ensureFonts();
  const svg = await satori(node as never, {
    width: opts.width,
    height: opts.height,
    fonts,
  });
  await ensureWasm();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: opts.outputWidth ?? opts.width },
  });
  return resvg.render().asPng();
}

/* ------------------------------------------------------------------ *
 * Conversión de un diseño del editor a nodos renderizables
 * ------------------------------------------------------------------ */

// deno-lint-ignore no-explicit-any
type Layer = Record<string, any>;

export interface LayoutSpec {
  width?: number;
  height?: number;
  background?: string;
  layers?: Layer[];
}

function textNode(layer: Layer): Node {
  const s = layer.textStyle ?? {};
  const align = s.textAlign === "right" ? "flex-end" : s.textAlign === "center" ? "center" : "flex-start";
  const banner = s.bannerStyle && s.bannerStyle !== "none";
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: layer.x ?? 0,
        top: layer.y ?? 0,
        width: layer.w ?? 100,
        height: layer.h ?? 40,
        display: "flex",
        alignItems: "center",
        justifyContent: align,
        padding: `${s.paddingY ?? 0}px ${s.paddingX ?? 0}px`,
        borderRadius: s.borderRadius ?? 0,
        backgroundColor: banner ? (s.bannerColor ?? "transparent") : "transparent",
        color: s.color ?? "#111111",
        fontSize: s.fontSize ?? 32,
        fontWeight: s.fontWeight ?? 400,
        lineHeight: s.lineHeight ? String(s.lineHeight) : "1.2",
        letterSpacing: s.letterSpacing ?? 0,
        textAlign: s.textAlign ?? "left",
        overflow: "hidden",
      },
      children: String(s.content ?? layer.name ?? ""),
    },
  };
}

function boxNode(layer: Layer, children?: Node[] | string): Node {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: layer.x ?? 0,
        top: layer.y ?? 0,
        width: layer.w ?? 100,
        height: layer.h ?? 100,
        display: "flex",
        backgroundColor: layer.color && layer.color !== "transparent" ? layer.color : "transparent",
        overflow: "hidden",
      },
      children,
    },
  };
}

function imageNode(layer: Layer): Node {
  return boxNode(layer, [
    {
      type: "img",
      props: {
        src: layer.imageUrl,
        style: { width: "100%", height: "100%", objectFit: "cover" },
      },
    },
  ]);
}

/** Convierte el JSON del editor en un nodo listo para `renderNodeToPng`. */
export function layoutToNode(spec: LayoutSpec): Node {
  const width = spec.width ?? 1920;
  const height = spec.height ?? 1080;
  const children: Node[] = [];

  for (const layer of spec.layers ?? []) {
    switch (layer.type) {
      case "text":
        children.push(textNode(layer));
        break;
      case "image":
        if (layer.imageUrl && /^https?:\/\//.test(layer.imageUrl)) children.push(imageNode(layer));
        else children.push(boxNode({ ...layer, color: layer.color ?? "#E5E7EB" }));
        break;
      case "video":
        // Un video no se puede rasterizar: se dibuja su marco.
        children.push(boxNode({ ...layer, color: "#1F2937" }));
        break;
      default:
        children.push(boxNode(layer));
    }
  }

  return {
    type: "div",
    props: {
      style: {
        width,
        height,
        display: "flex",
        position: "relative",
        backgroundColor: spec.background ?? "#FFFFFF",
      },
      children,
    },
  };
}
