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

/* ── Formas adicionales ── */
SHAPE_ELEMENTS.push(
  g("forma-hexagono", "Hexágono", ["hexagono", "forma", "geometrico"], "formas", [260, 240],
    rawSvg(`<path d="M65 0h130l65 120-65 120H65L0 120Z" fill="__C__"/>`, "0 0 260 240")),
  g("forma-rombo", "Rombo", ["rombo", "diamante", "forma"], "formas", [240, 240],
    rawSvg(`<path d="M120 0 240 120 120 240 0 120Z" fill="__C__"/>`, "0 0 240 240")),
  g("forma-pentagono", "Pentágono", ["pentagono", "forma", "geometrico"], "formas", [250, 240],
    rawSvg(`<path d="M125 0 250 92l-48 148H48L0 92Z" fill="__C__"/>`, "0 0 250 240")),
  g("forma-cruz", "Cruz", ["cruz", "mas", "forma"], "formas", [240, 240],
    rawSvg(`<path d="M92 0h56v92h92v56h-92v92H92v-92H0V92h92Z" fill="__C__"/>`, "0 0 240 240")),
  g("forma-corazon", "Corazón", ["corazon", "amor", "favorito", "forma"], "formas", [260, 240],
    rawSvg(`<path d="M130 235S8 162 8 82A72 72 0 0 1 130 34 72 72 0 0 1 252 82c0 80-122 153-122 153Z" fill="__C__"/>`, "0 0 260 240")),
  g("forma-rayo", "Rayo", ["rayo", "energia", "forma", "destacado"], "formas", [180, 260],
    rawSvg(`<path d="M108 0 12 148h60L60 260l108-160h-66Z" fill="__C__"/>`, "0 0 180 260")),
  g("forma-check", "Check", ["check", "chulo", "listo", "aprobado"], "formas", [260, 200],
    rawSvg(`<path d="M20 108 92 178 240 24" fill="none" stroke="__C__" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>`, "0 0 260 200")),
  g("forma-equis", "Equis", ["equis", "x", "cerrado", "no"], "formas", [220, 220],
    rawSvg(`<path d="M28 28 192 192M192 28 28 192" fill="none" stroke="__C__" stroke-width="34" stroke-linecap="round"/>`, "0 0 220 220")),
  g("forma-burbuja-pensamiento", "Burbuja de pensamiento", ["burbuja", "pensamiento", "nube", "dialogo"], "formas", [400, 300],
    rawSvg(`<path d="M96 40h208a76 76 0 0 1 0 152H150l-52 44v-44h-2a76 76 0 0 1 0-152Z" fill="__C__"/><circle cx="72" cy="252" r="22" fill="__C__"/><circle cx="34" cy="284" r="13" fill="__C__"/>`, "0 0 400 300")),
  g("forma-flecha-curva", "Flecha curva", ["flecha", "curva", "direccion", "señala"], "formas", [300, 220],
    rawSvg(`<path d="M20 190c30-110 130-160 240-150" fill="none" stroke="__C__" stroke-width="24" stroke-linecap="round"/><path d="M210 8h58v58" fill="none" stroke="__C__" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>`, "0 0 300 220")),
  g("forma-cinta-esquina", "Cinta de esquina", ["cinta", "esquina", "forma", "destacado"], "formas", [300, 300],
    rawSvg(`<path d="M0 0h300v300Z" fill="__C__"/>`, "0 0 300 300")),
  g("forma-semicirculo", "Semicírculo", ["semicirculo", "media luna", "forma"], "formas", [280, 150],
    rawSvg(`<path d="M0 140a140 140 0 0 1 280 0Z" fill="__C__"/>`, "0 0 280 150")),
);

/* ── Divisores adicionales ── */
DIVIDER_ELEMENTS.push(
  g("div-rombos", "Línea con rombos", ["divisor", "rombos", "adorno", "separador"], "divisores", [900, 60],
    rawSvg(`<path d="M0 30h340M560 30h340" stroke="__C__" stroke-width="8" stroke-linecap="round"/><path d="M400 30 420 10l20 20-20 20Z" fill="__C__"/><path d="M460 30 480 10l20 20-20 20Z" fill="__C__"/>`, "0 0 900 60")),
  g("div-zigzag", "Zigzag", ["divisor", "zigzag", "separador"], "divisores", [900, 60],
    rawSvg(`<path d="M0 44 30 16l30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28 30-28 30 28" fill="none" stroke="__C__" stroke-width="8" stroke-linejoin="round"/>`, "0 0 900 60")),
  g("div-gruesa", "Línea gruesa", ["divisor", "gruesa", "barra", "separador"], "divisores", [900, 40],
    rawSvg(`<rect y="8" width="900" height="24" rx="12" fill="__C__"/>`, "0 0 900 40")),
  g("marco-doble", "Marco doble", ["marco", "doble", "seccion", "borde"], "divisores", [820, 480],
    rawSvg(`<rect x="8" y="8" width="804" height="464" fill="none" stroke="__C__" stroke-width="14"/><rect x="34" y="34" width="752" height="412" fill="none" stroke="__C__" stroke-width="6"/>`, "0 0 820 480")),
  g("marco-arco", "Marco con arco", ["marco", "arco", "seccion", "menu"], "divisores", [640, 520],
    rawSvg(`<path d="M20 500V200a300 300 0 0 1 600 0v300Z" fill="none" stroke="__C__" stroke-width="14" stroke-linejoin="round"/>`, "0 0 640 520")),
  g("banda-diagonal", "Banda diagonal", ["banda", "diagonal", "fondo de seccion"], "divisores", [900, 200],
    rawSvg(`<path d="M0 40h900v90H0Z" fill="__C__" transform="rotate(-4 450 85)"/>`, "0 0 900 200")),
);

/* ── Precios adicionales ── */
PRICE_ELEMENTS.push(
  g("precio-porcentaje", "Círculo de descuento %", ["descuento", "porcentaje", "%", "promocion", "precio"], "precios", [280, 280],
    rawSvg(`<circle cx="110" cy="110" r="104" fill="__C__"/>` + centeredText("%", { x: 110, y: 118, size: 120, fill: "#FFFFFF", weight: 800, letter: 0 }), "0 0 220 220")),
  g("precio-etiqueta-off", "Etiqueta de descuento", ["descuento", "off", "etiqueta", "precio", "rebaja"], "precios", [360, 180],
    rawSvg(`<path d="M10 30h230l70 60-70 60H10Z" fill="__C__"/><circle cx="60" cy="90" r="14" fill="#FFFFFF"/>`, "0 0 340 180")),
  g("precio-hexagono", "Marco de precio · hexágono", ["precio", "hexagono", "marco"], "precios", [280, 260],
    rawSvg(`<path d="M65 0h130l65 120-65 120H65L0 120Z" fill="__C__"/>`, "0 0 260 240")),
  g("precio-cuadro", "Marco de precio · cuadro", ["precio", "cuadro", "marco", "valor"], "precios", [300, 200],
    rawSvg(`<rect x="6" y="6" width="288" height="188" rx="18" fill="__C__"/><rect x="26" y="26" width="248" height="148" rx="10" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-opacity="0.55"/>`, "0 0 300 200")),
  g("precio-desde", "Sello «Desde»", ["desde", "precio", "sello", "valor"], "precios", [260, 130],
    rawSvg(`<rect x="4" y="4" width="252" height="122" rx="61" fill="__C__"/>` + centeredText("DESDE", { x: 130, y: 66, size: 44, fill: "#FFFFFF", weight: 800, letter: 3 }), "0 0 260 130")),
  g("precio-iva", "Sello «IVA incluido»", ["iva incluido", "impuesto", "precio", "colombia"], "precios", [300, 90],
    rawSvg(`<rect x="3" y="3" width="294" height="84" rx="42" fill="none" stroke="__C__" stroke-width="6"/>` + centeredText("IVA INCLUIDO", { x: 150, y: 46, size: 32, fill: "__C__", weight: 700, letter: 2 }), "0 0 300 90")),
  g("ficha-0", "Ficha 0", ["numero", "ficha", "0", "menu numerado"], "precios", [180, 180],
    rawSvg(`<circle cx="90" cy="90" r="84" fill="__C__"/>` + centeredText("0", { x: 90, y: 96, size: 96, fill: "#FFFFFF", weight: 800, letter: 0 }), "0 0 180 180")),
  g("ficha-10", "Ficha 10", ["numero", "ficha", "10", "menu numerado"], "precios", [180, 180],
    rawSvg(`<circle cx="90" cy="90" r="84" fill="__C__"/>` + centeredText("10", { x: 90, y: 96, size: 82, fill: "#FFFFFF", weight: 800, letter: 0 }), "0 0 180 180")),
);

/* ── Fondos adicionales ── */
BACKGROUND_ELEMENTS.push(
  {
    id: "fondo-ladrillo",
    label: "Ladrillo",
    tags: ["ladrillo", "pared", "rustico", "textura", "fondo"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () =>
      rawSvg(
        `<rect width="960" height="540" fill="__C__" opacity="0.2"/><defs><pattern id="lb" width="120" height="60" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="116" height="26" fill="__C__" opacity="0.3"/><rect x="-58" y="32" width="116" height="26" fill="__C__" opacity="0.3"/><rect x="62" y="32" width="116" height="26" fill="__C__" opacity="0.3"/></pattern></defs><rect width="960" height="540" fill="url(%23lb)"/>`,
        "0 0 960 540",
      ),
  },
  {
    id: "fondo-patron-cuadros",
    label: "Patrón cuadros",
    tags: ["patron", "cuadros", "mantel", "fondo"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () =>
      rawSvg(
        `<defs><pattern id="cd" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="__C__" opacity="0.28"/><rect x="40" y="40" width="40" height="40" fill="__C__" opacity="0.28"/></pattern></defs><rect width="960" height="540" fill="url(%23cd)"/>`,
        "0 0 960 540",
      ),
  },
  {
    id: "fondo-patron-rombos",
    label: "Patrón rombos",
    tags: ["patron", "rombos", "geometrico", "fondo"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () =>
      rawSvg(
        `<defs><pattern id="rb" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M40 8 72 40 40 72 8 40Z" fill="none" stroke="__C__" stroke-width="5" opacity="0.3"/></pattern></defs><rect width="960" height="540" fill="url(%23rb)"/>`,
        "0 0 960 540",
      ),
  },
  {
    id: "fondo-terrazo",
    label: "Terrazo",
    tags: ["terrazo", "textura", "moderno", "fondo"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () =>
      rawSvg(
        `<rect width="960" height="540" fill="__C__" opacity="0.12"/>` +
          Array.from({ length: 40 }, (_, i) => {
            const x = (i * 173) % 930 + 15;
            const y = (i * 97) % 510 + 15;
            const r = 5 + (i % 5) * 3;
            return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="__C__" opacity="0.3" transform="rotate(${(i * 37) % 180} ${x} ${y})"/>`;
          }).join(""),
        "0 0 960 540",
      ),
  },
  {
    id: "fondo-degradado-suave",
    label: "Degradado suave",
    tags: ["degradado", "gradiente", "suave", "fondo", "marca"],
    category: "fondos",
    kind: "background",
    size: [1920, 1080],
    svg: () =>
      rawSvg(
        `<defs><linearGradient id="gs" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="__P__" stop-opacity="0.9"/><stop offset="100%" stop-color="__S__" stop-opacity="0.45"/></linearGradient></defs><rect width="960" height="540" fill="url(%23gs)"/>`,
        "0 0 960 540",
      ),
  },
);
