import { rawSvg, strokeSvg, centeredText } from "./svg";
import type { ElementDef } from "./types";

const g = (
  id: string,
  label: string,
  tags: string[],
  category: ElementDef["category"],
  size: [number, number],
  svg: string,
): ElementDef => ({ id, label, tags, category, kind: "graphic", size, svg: () => svg });

/* ───────── Precios y números ───────── */

export const PRICE_ELEMENTS: ElementDef[] = [
  g("precio-circulo", "Marco de precio · círculo", ["precio", "marco", "circulo", "valor"], "precios", [280, 280],
    rawSvg(`<circle cx="110" cy="110" r="104" fill="__C__"/><circle cx="110" cy="110" r="88" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-opacity="0.6"/>`, "0 0 220 220")),
  g("precio-estrella", "Marco de precio · estrella", ["precio", "estrella", "promocion", "explosion"], "precios", [300, 300],
    rawSvg(
      `<path fill="__C__" d="${starBurst(110, 110, 106, 82, 12)}"/>`,
      "0 0 220 220",
    )),
  g("precio-cinta", "Marco de precio · cinta", ["precio", "cinta", "banda", "valor"], "precios", [520, 150],
    rawSvg(`<path d="M0 10h420l-34 65 34 65H0l30-65Z" fill="__C__"/>`, "0 0 420 150")),
  g("precio-tachado", "Precio tachado", ["precio tachado", "antes", "ahora", "descuento", "rebaja"], "precios", [420, 130],
    rawSvg(
      centeredText("$00.000", { x: 210, y: 46, size: 46, fill: "__C__", weight: 700, letter: 0 }) +
        `<path d="M64 46h292" stroke="__C__" stroke-width="8" stroke-linecap="round"/>`,
      "0 0 420 130",
    )),
  g("peso-light", "Signo de peso · liviano", ["peso", "cop", "pesos", "moneda", "$"], "precios", [140, 180],
    rawSvg(centeredText("$", { x: 70, y: 92, size: 150, fill: "__C__", weight: 400, letter: 0 }), "0 0 140 180")),
  g("peso-medio", "Signo de peso · medio", ["peso", "cop", "pesos", "moneda", "$"], "precios", [140, 180],
    rawSvg(centeredText("$", { x: 70, y: 92, size: 150, fill: "__C__", weight: 600, letter: 0 }), "0 0 140 180")),
  g("peso-bold", "Signo de peso · grueso", ["peso", "cop", "pesos", "moneda", "$"], "precios", [140, 180],
    rawSvg(centeredText("$", { x: 70, y: 92, size: 150, fill: "__C__", weight: 800, letter: 0 }), "0 0 140 180")),
  ...Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return g(
      `ficha-${n}`,
      `Ficha ${n}`,
      ["numero", "ficha", `${n}`, "menu numerado", "pedido por numero"],
      "precios",
      [180, 180],
      rawSvg(
        `<circle cx="90" cy="90" r="84" fill="__C__"/>` +
          centeredText(String(n), { x: 90, y: 96, size: 96, fill: "#FFFFFF", weight: 800, letter: 0 }),
        "0 0 180 180",
      ),
    );
  }),
];

function starBurst(cx: number, cy: number, outer: number, inner: number, points: number) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

/* ───────── Divisores y marcos ───────── */

export const DIVIDER_ELEMENTS: ElementDef[] = [
  g("div-recta", "Línea recta", ["divisor", "linea", "separador", "recta"], "divisores", [900, 40],
    rawSvg(`<path d="M0 20h900" stroke="__C__" stroke-width="10" stroke-linecap="round"/>`, "0 0 900 40")),
  g("div-adorno", "Línea con adorno", ["divisor", "adorno", "ornamento", "separador"], "divisores", [900, 60],
    rawSvg(
      `<path d="M0 30h370M530 30h370" stroke="__C__" stroke-width="8" stroke-linecap="round"/>` +
        `<path d="M450 8 472 30 450 52 428 30Z" fill="__C__"/><circle cx="400" cy="30" r="7" fill="__C__"/><circle cx="500" cy="30" r="7" fill="__C__"/>`,
      "0 0 900 60",
    )),
  g("div-punteada", "Línea punteada", ["divisor", "punteada", "puntos", "separador"], "divisores", [900, 40],
    rawSvg(`<path d="M0 20h900" stroke="__C__" stroke-width="10" stroke-linecap="round" stroke-dasharray="4 34"/>`, "0 0 900 40")),
  g("div-doble", "Línea doble", ["divisor", "doble", "separador"], "divisores", [900, 60],
    rawSvg(`<path d="M0 18h900M0 42h900" stroke="__C__" stroke-width="8" stroke-linecap="round"/>`, "0 0 900 60")),
  g("div-cubiertos", "Separador con cubiertos", ["divisor", "cubiertos", "tenedor", "cuchillo", "menu"], "divisores", [900, 100],
    rawSvg(
      `<path d="M0 50h370M530 50h370" stroke="__C__" stroke-width="8" stroke-linecap="round"/>` +
        `<g stroke="__C__" stroke-width="8" fill="none" stroke-linecap="round"><path d="M430 16v24a10 10 0 0 0 20 0V16"/><path d="M440 40v44"/><path d="M478 16c-8 4-12 14-12 24h12Z"/><path d="M478 40v44"/></g>`,
      "0 0 900 100",
    )),
  g("div-hoja", "Separador con hoja", ["divisor", "hoja", "natural", "organico"], "divisores", [900, 90],
    rawSvg(
      `<path d="M0 45h380M520 45h380" stroke="__C__" stroke-width="8" stroke-linecap="round"/>` +
        `<path d="M410 62c0-24 18-42 42-42 0 24-18 42-42 42Z" fill="__C__"/>`,
      "0 0 900 90",
    )),
  g("div-estrella", "Separador con estrella", ["divisor", "estrella", "destacado"], "divisores", [900, 90],
    rawSvg(
      `<path d="M0 45h390M510 45h390" stroke="__C__" stroke-width="8" stroke-linecap="round"/>` +
        `<path d="M450 14 464 40l28 4-20 20 5 28-27-14-27 14 5-28-20-20 28-4Z" fill="__C__"/>`,
      "0 0 900 90",
    )),
  g("marco-rect", "Marco rectangular", ["marco", "recuadro", "seccion", "borde"], "divisores", [820, 480],
    rawSvg(`<rect x="8" y="8" width="804" height="464" fill="none" stroke="__C__" stroke-width="12"/>`, "0 0 820 480")),
  g("marco-redondo", "Marco esquinas redondeadas", ["marco", "redondeado", "seccion", "borde"], "divisores", [820, 480],
    rawSvg(`<rect x="10" y="10" width="800" height="460" rx="46" fill="none" stroke="__C__" stroke-width="12"/>`, "0 0 820 480")),
  g("marco-pizarra", "Marco tipo pizarra", ["marco", "pizarra", "tablero", "menu del dia"], "divisores", [820, 500],
    rawSvg(
      `<rect x="6" y="6" width="808" height="488" rx="18" fill="none" stroke="__C__" stroke-width="20"/>` +
        `<rect x="40" y="40" width="740" height="420" rx="8" fill="none" stroke="__C__" stroke-width="6" stroke-dasharray="2 18"/>`,
      "0 0 820 500",
    )),
  g("marco-servilleta", "Marco tipo servilleta", ["marco", "servilleta", "onda", "borde"], "divisores", [820, 480],
    rawSvg(
      `<path d="M20 20h780v440H20Z" fill="none" stroke="__C__" stroke-width="10" stroke-dasharray="26 14" stroke-linecap="round"/>` +
        `<path d="M44 44h732v392H44Z" fill="none" stroke="__C__" stroke-width="5"/>`,
      "0 0 820 480",
    )),
  g("banda-solida", "Banda sólida", ["fondo de seccion", "banda", "franja"], "divisores", [900, 160],
    rawSvg(`<rect width="900" height="160" fill="__C__"/>`, "0 0 900 160")),
  g("banda-textura", "Banda con textura", ["fondo de seccion", "banda", "textura", "rayas"], "divisores", [900, 160],
    rawSvg(
      `<defs><pattern id="bt" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="18" fill="__C__" opacity="0.9"/></pattern></defs><rect width="900" height="160" fill="__C__" opacity="0.22"/><rect width="900" height="160" fill="url(%23bt)" opacity="0.35"/>`,
      "0 0 900 160",
    )),
  g("banda-cinta", "Banda tipo cinta", ["fondo de seccion", "cinta", "banda", "titulo"], "divisores", [900, 190],
    rawSvg(`<path d="M0 20h900l-60 75 60 75H0l60-75Z" fill="__C__"/>`, "0 0 900 190")),
];

/* ───────── Formas ───────── */

export const SHAPE_ELEMENTS: ElementDef[] = [
  g("forma-rect", "Rectángulo", ["rectangulo", "forma", "caja", "bloque"], "formas", [420, 260],
    rawSvg(`<rect width="420" height="260" fill="__C__"/>`, "0 0 420 260")),
  g("forma-rect-redondo", "Rectángulo redondeado", ["rectangulo", "redondeado", "forma", "caja"], "formas", [420, 260],
    rawSvg(`<rect width="420" height="260" rx="42" fill="__C__"/>`, "0 0 420 260")),
  g("forma-circulo", "Círculo", ["circulo", "forma", "punto"], "formas", [260, 260],
    rawSvg(`<circle cx="130" cy="130" r="130" fill="__C__"/>`, "0 0 260 260")),
  g("forma-anillo", "Anillo", ["anillo", "circulo", "borde", "forma"], "formas", [260, 260],
    rawSvg(`<circle cx="130" cy="130" r="118" fill="none" stroke="__C__" stroke-width="20"/>`, "0 0 260 260")),
  g("forma-triangulo", "Triángulo", ["triangulo", "forma"], "formas", [260, 240],
    rawSvg(`<path d="M130 0 260 240H0Z" fill="__C__"/>`, "0 0 260 240")),
  g("forma-estrella", "Estrella", ["estrella", "forma", "destacado"], "formas", [260, 250],
    rawSvg(`<path d="M130 8 165 92l90 8-68 60 20 88-77-46-77 46 20-88-68-60 90-8Z" fill="__C__"/>`, "0 0 260 250")),
  g("forma-flecha", "Flecha", ["flecha", "forma", "señala", "direccion"], "formas", [360, 180],
    rawSvg(`<path d="M0 60h220V10l140 80-140 80v-50H0Z" fill="__C__"/>`, "0 0 360 180")),
  g("forma-linea", "Línea", ["linea", "forma", "trazo"], "formas", [500, 24],
    rawSvg(`<rect width="500" height="24" rx="12" fill="__C__"/>`, "0 0 500 24")),
  g("forma-marco", "Marco", ["marco", "forma", "borde"], "formas", [420, 300],
    rawSvg(`<rect x="10" y="10" width="400" height="280" fill="none" stroke="__C__" stroke-width="20"/>`, "0 0 420 300")),
  g("forma-burbuja", "Burbuja de diálogo", ["burbuja", "dialogo", "globo", "mensaje"], "formas", [400, 300],
    rawSvg(`<path d="M40 20h320a30 30 0 0 1 30 30v150a30 30 0 0 1-30 30H180l-70 60v-60H40a30 30 0 0 1-30-30V50a30 30 0 0 1 30-30Z" fill="__C__"/>`, "0 0 400 300")),
  g("forma-salpicadura", "Salpicadura", ["salpicadura", "mancha", "splash", "forma"], "formas", [320, 320],
    rawSvg(`<path d="M160 12c30 24 66-8 84 22s-14 52 6 76 56 18 50 54-52 30-70 58-6 62-42 66-42-34-76-42-62 16-80-14 22-50 16-84-30-52-6-76 62 6 88 4 12-40 30-64Z" fill="__C__"/>`, "0 0 320 320")),
  g("forma-organica", "Forma orgánica", ["organica", "mancha", "blob", "forma"], "formas", [340, 300],
    rawSvg(`<path d="M42 118C58 46 132 8 200 22c68 14 122 74 112 138-10 64-86 122-152 116S26 190 42 118Z" fill="__C__"/>`, "0 0 340 300")),
];

/* ───────── Fondos ───────── */

const TEXTURES: { id: string; label: string; tags: string[]; inner: string }[] = [
  {
    id: "madera",
    label: "Madera",
    tags: ["madera", "wood", "rustico", "textura"],
    inner:
      `<rect width="960" height="540" fill="__C__" opacity="0.18"/>` +
      Array.from({ length: 6 }, (_, i) => {
        const y = i * 90;
        return `<rect y="${y}" width="960" height="88" fill="__C__" opacity="${i % 2 ? 0.3 : 0.22}"/><path d="M0 ${y + 30}q240 -18 480 0t480 0" stroke="__C__" stroke-width="4" fill="none" opacity="0.45"/><path d="M0 ${y + 62}q240 18 480 0t480 0" stroke="__C__" stroke-width="3" fill="none" opacity="0.35"/>`;
      }).join(""),
  },
  {
    id: "pizarra",
    label: "Pizarra",
    tags: ["pizarra", "tablero", "chalkboard", "menu del dia", "textura"],
    inner:
      `<rect width="960" height="540" fill="__C__" opacity="0.85"/>` +
      `<defs><pattern id="pz" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M0 30h60M30 0v60" stroke="#FFFFFF" stroke-width="1.5" opacity="0.06"/></pattern></defs>` +
      `<rect width="960" height="540" fill="url(%23pz)"/>` +
      `<ellipse cx="480" cy="270" rx="380" ry="200" fill="#FFFFFF" opacity="0.05"/>`,
  },
  {
    id: "kraft",
    label: "Papel kraft",
    tags: ["kraft", "papel", "artesanal", "textura"],
    inner:
      `<rect width="960" height="540" fill="__C__" opacity="0.28"/>` +
      `<defs><pattern id="kr" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r="1.4" fill="__C__" opacity="0.45"/><circle cx="10" cy="11" r="1" fill="__C__" opacity="0.35"/></pattern></defs>` +
      `<rect width="960" height="540" fill="url(%23kr)"/>`,
  },
  {
    id: "concreto",
    label: "Concreto",
    tags: ["concreto", "cemento", "industrial", "textura"],
    inner:
      `<rect width="960" height="540" fill="__C__" opacity="0.35"/>` +
      `<defs><radialGradient id="cc" cx="35%" cy="30%"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.16"/><stop offset="100%" stop-color="#000000" stop-opacity="0.12"/></radialGradient></defs>` +
      `<rect width="960" height="540" fill="url(%23cc)"/>` +
      Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 137) % 940 + 10}" cy="${(i * 211) % 520 + 10}" r="${3 + (i % 4) * 2}" fill="#000000" opacity="0.05"/>`).join(""),
  },
  {
    id: "marmol",
    label: "Mármol",
    tags: ["marmol", "elegante", "textura", "premium"],
    inner:
      `<rect width="960" height="540" fill="__C__" opacity="0.12"/>` +
      Array.from({ length: 7 }, (_, i) =>
        `<path d="M${-100 + i * 150} 540q120 -180 60 -300t80 -260" stroke="__C__" stroke-width="${2 + (i % 3)}" fill="none" opacity="0.35"/>`,
      ).join(""),
  },
  {
    id: "tela",
    label: "Tela",
    tags: ["tela", "lino", "textil", "textura"],
    inner:
      `<rect width="960" height="540" fill="__C__" opacity="0.2"/>` +
      `<defs><pattern id="tl" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 0h10M0 5h10" stroke="__C__" stroke-width="1.6" opacity="0.28"/><path d="M0 0v10M5 0v10" stroke="__C__" stroke-width="1.2" opacity="0.2"/></pattern></defs>` +
      `<rect width="960" height="540" fill="url(%23tl)"/>`,
  },
];

const PATTERNS: { id: string; label: string; tags: string[]; inner: string }[] = [
  {
    id: "puntos",
    label: "Puntos",
    tags: ["patron", "puntos", "geometrico", "suave"],
    inner: `<defs><pattern id="pt" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="7" fill="__C__" opacity="0.35"/></pattern></defs><rect width="960" height="540" fill="url(%23pt)"/>`,
  },
  {
    id: "diagonales",
    label: "Diagonales",
    tags: ["patron", "rayas", "diagonal", "geometrico"],
    inner: `<defs><pattern id="dg" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="40" fill="__C__" opacity="0.28"/></pattern></defs><rect width="960" height="540" fill="url(%23dg)"/>`,
  },
  {
    id: "triangulos",
    label: "Triángulos",
    tags: ["patron", "triangulos", "geometrico"],
    inner: `<defs><pattern id="tr" width="70" height="60" patternUnits="userSpaceOnUse"><path d="M35 8 66 54H4Z" fill="__C__" opacity="0.25"/></pattern></defs><rect width="960" height="540" fill="url(%23tr)"/>`,
  },
  {
    id: "ondas",
    label: "Ondas",
    tags: ["patron", "ondas", "curvas", "suave"],
    inner: `<defs><pattern id="on" width="120" height="60" patternUnits="userSpaceOnUse"><path d="M0 40q30 -30 60 0t60 0" stroke="__C__" stroke-width="6" fill="none" opacity="0.3"/></pattern></defs><rect width="960" height="540" fill="url(%23on)"/>`,
  },
];

export const BACKGROUND_ELEMENTS: ElementDef[] = [
  ...TEXTURES.map<ElementDef>((t) => ({
    id: `fondo-${t.id}`,
    label: t.label,
    tags: [...t.tags, "fondo"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () => rawSvg(t.inner, "0 0 960 540"),
  })),
  {
    id: "fondo-degradado-diagonal",
    label: "Degradado diagonal",
    tags: ["degradado", "gradiente", "fondo", "marca"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () =>
      rawSvg(
        `<defs><linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="__P__"/><stop offset="100%" stop-color="__S__"/></linearGradient></defs><rect width="960" height="540" fill="url(%23gd)"/>`,
        "0 0 960 540",
      ),
  },
  {
    id: "fondo-degradado-vertical",
    label: "Degradado vertical",
    tags: ["degradado", "gradiente", "fondo", "marca"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () =>
      rawSvg(
        `<defs><linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="__P__"/><stop offset="100%" stop-color="__S__"/></linearGradient></defs><rect width="960" height="540" fill="url(%23gv)"/>`,
        "0 0 960 540",
      ),
  },
  {
    id: "fondo-degradado-radial",
    label: "Degradado radial",
    tags: ["degradado", "gradiente", "radial", "fondo", "marca"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () =>
      rawSvg(
        `<defs><radialGradient id="gr" cx="50%" cy="40%"><stop offset="0%" stop-color="__S__"/><stop offset="100%" stop-color="__P__"/></radialGradient></defs><rect width="960" height="540" fill="url(%23gr)"/>`,
        "0 0 960 540",
      ),
  },
  ...PATTERNS.map<ElementDef>((p) => ({
    id: `fondo-patron-${p.id}`,
    label: `Patrón ${p.label.toLowerCase()}`,
    tags: [...p.tags, "fondo"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () => rawSvg(p.inner, "0 0 960 540"),
  })),
];

/** Iconos auxiliares reutilizados por sugerencias (no exportados en categorías). */
export const _unusedStroke = strokeSvg;
