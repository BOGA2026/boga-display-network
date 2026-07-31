import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  TV_RULES,
  tvTypography,
  enforceTvProposal,
} from "../_shared/tv-legibility.ts";
import {
  ARCHETYPES,
  buildArchetypePrompt,
  enforceArchetype,
  normalizeArchetypeOrder,
  type ArchetypeId,
} from "../_shared/design-archetypes.ts";
import {
  validarPropuesta,
  normalizeProposalVisuals,
  logViolations,
  OVERLAY_RANGE,
} from "../_shared/proposal-validator.ts";

/** Photography must always be well lit — a dark frame reads as a loading error. */
const IMAGE_LIGHT_TERMS = "bright well lit natural side light balanced exposure";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Canvas reference sizes (same ratios the editor uses). */
const CANVAS = {
  "16:9": { w: 960, h: 540 },
  "9:16": { w: 540, h: 960 },
  "1:1": { w: 700, h: 700 },
} as const;

/** Legibility rules injected into every system prompt — these pieces are read at 3-5 m. */
const TV_LEGIBILITY_RULES = `
REGLAS DE LEGIBILIDAD EN TELEVISOR (OBLIGATORIAS — SE VALIDAN AUTOMÁTICAMENTE):
Estas piezas se ven en un televisor a 3-5 metros, NO en un escritorio.
Tamaños mínimos como PORCENTAJE DE LA ALTURA del lienzo:
- Nombre del plato: mínimo 4% de la altura
- Precio: mínimo 4% de la altura, con el mismo peso visual o mayor que el nombre
- Descripción: mínimo 2,2% de la altura y máximo 2 líneas
- Nombre del restaurante: entre 6% y 8% de la altura
- Nada por debajo del 2% de la altura
- Si un texto no cabe respetando estos mínimos, van MENOS platos; nunca letra más chica.
Otras reglas:
- Máximo ${TV_RULES.maxItems} platos por pieza en total (sumando todas las secciones).
- Contraste mínimo 7:1 entre texto y fondo (se calcula con la fórmula WCAG sobre los colores reales, no sirve declararlo).
- Margen de seguridad del 5% en todos los bordes (overscan de televisores): no pongas contenido pegado al borde.
- El precio va alineado a la derecha o inmediatamente después del nombre. PROHIBIDAS las líneas punteadas largas entre plato y precio.
- Descripciones cortas (máx. 8 palabras). Si no caben al 2,2%, se ELIMINAN de toda la pieza: nunca se encogen.
- PROHIBIDO truncar un nombre de plato o un precio. Si un nombre no cabe: primero menos platos, después dos líneas, y solo al final bajar al mínimo del 4%.

COLOR DEL PRECIO (REGLA ÚNICA DE TODA LA APP):
- color_precio = color de acento de la marca del negocio; si ese acento no llega a 7:1 sobre el fondo, usa blanco puro (#ffffff).
- PROHIBIDO rojo, verde y ámbar en el precio: están reservados para estados del sistema (error, éxito, advertencia).
- Precio y nombre comparten línea base y tamaño. El precio puede ir en peso mayor, nunca en un color más llamativo que el nombre.

OCUPACIÓN VERTICAL (se valida):
- Los platos ocupan entre el 70% y el 90% de la altura útil (altura total menos márgenes de seguridad).
- Calcula el espaciado entre filas dividiendo ese alto entre la cantidad de platos. Nada de espaciado fijo.
- Con pocos platos NO los apiles arriba: sube interlineado y tamaño hasta llenar el espacio. Cuatro platos en un televisor de 55" deben verse enormes.
- Reserva el 8% inferior para una franja de cierre: logo del negocio o CTA corta ("Pide en caja"), en tamaño mínimo 2,5% de la altura.
- En dos columnas reparte los platos parejo. Con número impar la columna izquierda lleva el extra y la derecha compensa con más interlineado.
- Si el bloque más bajo termina antes del 75% de la altura útil, la propuesta se rechaza.

FOTOGRAFÍA:
- El título de la pieza es el NOMBRE DEL NEGOCIO. "Menú del día" solo puede ir como subtítulo.
- background_image_query siempre pide escenas BIEN ILUMINADAS: "bien iluminado, luz natural lateral, exposición equilibrada".
- PROHIBIDO pedir "escena oscura", "penumbra", "low key", "moody dark" o similares.
- overlay_opacity entre ${OVERLAY_RANGE.min} y ${OVERLAY_RANGE.max}. Nunca por encima de ${OVERLAY_RANGE.hardMax}: a partir de ahí la foto deja de aportar y la pieza parece un error de carga.
- El oscurecimiento va SOLO en la zona del texto (banda o degradado direccional), nunca sobre toda la imagen.
`;


// ─── Specialized system prompts per content type ───

const PROMPT_MENU = `Eres un diseñador especialista en menús para pantallas de digital signage en restaurantes.

Un menú de pantalla tiene estructura específica:
- Header: nombre del restaurante + tagline
- Secciones: Entradas, Platos principales, Postres, Bebidas
- Cada ítem: nombre del plato + descripción corta + precio
- Footer: mensaje o CTA ("Pide en caja", "Delivery disponible")

REGLAS DE DISEÑO PARA MENÚS:
- Layout en 2 columnas para platos (izquierda y derecha)
- Fondo oscuro SIEMPRE (#1a0a00, #0d0d0d, #1a1a0a) para que los platos resalten
- Precio en color acento vibrante (dorado #ffd700, verde #00e676, naranja #ff6b35)
- Nombre del plato: bold, mínimo 4% de la ALTURA del lienzo
- Descripción: light, mínimo 2,2% de la altura, máximo 2 líneas (máx. 8 palabras)
- Precio: bold, mínimo 4% de la altura, mismo peso visual o mayor que el nombre, alineado a la derecha
- Separador horizontal entre secciones
- Nombre del restaurante arriba: entre 6% y 8% de la altura

fuente_titulo debe ser una de: "Oswald" | "Playfair Display" | "Bebas Neue"
fuente_cuerpo debe ser una de: "Inter" | "DM Sans"

Genera el JSON con esta estructura EXACTA para menús:
{
  "propuestas": [
    {
      "id": 1,
      "nombre": "nombre del concepto",
      "concepto": "atmósfera del restaurante",
      "tipo_layout": "menu_dos_columnas",
      "background_color": "#hex oscuro",
      "background_image_query": "dark restaurant interior moody food photography",
      "overlay_color": "#000000",
      "overlay_opacity": 0.75,
      "color_texto": "#ffffff",
      "color_acento": "#hex vibrante",
      "fuente_titulo": "Oswald",
      "fuente_cuerpo": "Inter",
      "header": {
        "nombre_restaurante": "extraer del prompt del cliente",
        "tagline": "frase corta del restaurante",
        "size": 52
      },
      "secciones": [
        {
          "nombre": "nombre de sección (ej: Entradas)",
          "items": [
            {
              "plato": "nombre del plato",
              "descripcion": "descripción corta apetitosa",
              "precio": "$0.000"
            }
          ]
        }
      ],
      "footer_texto": "mensaje CTA del restaurante",
      "elementos_decorativos": [
        { "tipo": "linea_horizontal", "color": "#hex acento", "opacity": 0.4, "posicion": "entre header y contenido" },
        { "tipo": "banda_inferior", "color": "#hex acento", "opacity": 0.15, "posicion": "franja inferior" }
      ]
    },
    { "id": 2, "..." : "segunda propuesta con paleta diferente" },
    { "id": 3, "..." : "tercera propuesta con paleta diferente" }
  ]
}

IMPORTANTE:
- Si el cliente ya especificó platos, precios, combos, bebidas, nombres o categorías, DEBES usar exclusivamente esa información como base.
- NO cambies platos, NO agregues productos no mencionados, NO cambies precios y NO inventes secciones incompatibles cuando el prompt ya trae menú concreto.
- Solo puedes completar con contenido coherente si el cliente NO incluyó platos o precios suficientes.
- Si el prompt incluye una lista concreta, distribúyela en secciones sin alterar el contenido esencial.
- Los precios deben ser realistas para Colombia (COP) únicamente cuando debas completar faltantes.
- Las 3 propuestas deben tener paletas y conceptos DIFERENTES, pero conservar el mismo contenido del menú.
- PROHIBIDO usar placeholders como "TEXTO PRINCIPAL", "Subtítulo del diseño" o "Ver más".`;

const PROMPT_PROMO = `Eres un diseñador especialista en pantallas promocionales de alto impacto para retail y restaurantes.

Una pantalla de promoción tiene:
- Elemento dominante: el porcentaje o valor del descuento (ocupa 40-50% del canvas, tipografía gigante 120-180px)
- Producto o servicio promocionado
- Precio antes y después (tachado y nuevo precio)
- Fecha límite o condición ("Solo hoy", "Este fin de semana")
- CTA urgente

REGLAS:
- Colores de alta energía: rojo, naranja, amarillo, verde neón — NUNCA colores suaves
- El número del descuento debe ser el elemento más grande
- Usar badge_cta con urgencia ("¡SOLO HOY!", "ÚLTIMAS UNIDADES")
- Fondo puede ser de color sólido intenso o imagen de producto
- Composición asimétrica y dinámica

fuente_titulo debe ser una de: "Oswald" | "Montserrat" | "Playfair Display" | "Space Grotesk" | "Bebas Neue"
fuente_cuerpo debe ser una de: "Inter" | "Roboto" | "DM Sans" | "Source Sans Pro" | "Cormorant"

Responde ÚNICAMENTE con JSON sin markdown:
{
  "propuestas": [
    {
      "id": 1,
      "nombre": "nombre evocador del concepto",
      "concepto": "1 línea de atmósfera",
      "background_color": "#hex intenso",
      "background_image_query": "query cinematográfico 6-8 palabras inglés",
      "overlay_color": "#000000",
      "overlay_opacity": 0.45,
      "layout": "centrado | izquierda | derecha",
      "texto_principal": "30% OFF o similar (el descuento grande)",
      "texto_secundario": "qué producto y condición",
      "texto_cta": "2-3 palabras acción urgente",
      "color_texto": "#ffffff",
      "color_acento": "#hex vibrante energético",
      "fuente_titulo": "Oswald",
      "fuente_cuerpo": "Inter",
      "titulo_size": 140,
      "subtitulo_size": 28,
      "elementos_decorativos": [
        { "tipo": "nombre", "color": "#hex", "opacity": 0.8, "posicion": "descripción" }
      ]
    },
    { "id": 2 },
    { "id": 3 }
  ]
}

Las 3 propuestas deben tener layouts DIFERENTES y paletas DIFERENTES.
Cada propuesta debe tener mínimo 3 elementos_decorativos.

FIDELIDAD AL BRIEFING:
- Usa únicamente descuentos, marcas, precios, fechas, horarios, sedes, beneficios y mensajes que aparezcan en el briefing.
- Si el cliente menciona un porcentaje, precio, marca, ciudad o condición específica, no la cambies ni la reemplaces.
- NO inventes artistas, marcas, horarios, beneficios, slogans, ubicaciones ni condiciones no mencionadas.
- Si falta un dato, omítelo; no lo rellenes con imaginación.`;

const PROMPT_BIENVENIDA = `Eres un diseñador especialista en pantallas de bienvenida para digital signage en lobbies, hoteles, oficinas y restaurantes.

Una pantalla de bienvenida transmite:
- Calidez y hospitalidad
- Identidad del negocio
- Información útil (horario, WiFi, indicaciones)
- Mensaje de bienvenida personalizado

REGLAS:
- Tipografía elegante y acogedora
- Fondos cálidos o sofisticados
- Jerarquía clara: saludo grande + nombre del negocio + info secundaria
- Elementos decorativos sutiles, no agresivos
- Puede incluir reloj, clima, QR para WiFi

fuente_titulo debe ser una de: "Oswald" | "Montserrat" | "Playfair Display" | "Space Grotesk" | "Bebas Neue"
fuente_cuerpo debe ser una de: "Inter" | "Roboto" | "DM Sans" | "Source Sans Pro" | "Cormorant"

Responde ÚNICAMENTE con JSON sin markdown:
{
  "propuestas": [
    {
      "id": 1,
      "nombre": "nombre evocador del concepto",
      "concepto": "1 línea de atmósfera",
      "background_color": "#hex sofisticado",
      "background_image_query": "query cinematográfico 6-8 palabras inglés",
      "overlay_color": "#000000",
      "overlay_opacity": 0.55,
      "layout": "centrado | izquierda | derecha",
      "texto_principal": "BIENVENIDO o mensaje de saludo",
      "texto_secundario": "nombre del negocio o info complementaria",
      "texto_cta": "info adicional breve",
      "color_texto": "#ffffff",
      "color_acento": "#hex elegante",
      "fuente_titulo": "Playfair Display",
      "fuente_cuerpo": "Cormorant",
      "titulo_size": 84,
      "subtitulo_size": 28,
      "elementos_decorativos": [
        { "tipo": "nombre", "color": "#hex", "opacity": 0.8, "posicion": "descripción" }
      ]
    },
    { "id": 2 },
    { "id": 3 }
  ]
}

Las 3 propuestas deben tener layouts DIFERENTES y paletas DIFERENTES.
Cada propuesta debe tener mínimo 3 elementos_decorativos.

FIDELIDAD AL BRIEFING:
- Usa únicamente nombres, lugares, horarios, servicios, beneficios o mensajes mencionados por el cliente.
- NO inventes WiFi, clima, horarios, amenities ni indicaciones si el briefing no los trae.
- Si falta información, mantén el copy sobrio y fiel.`;

const PROMPT_EVENTO = `Eres un diseñador especialista en pantallas de eventos para digital signage.

Una pantalla de evento tiene:
- Nombre del evento (dominante)
- Fecha y hora (prominente)
- Lugar / ubicación
- Artista, ponente o atracción principal
- CTA (comprar entradas, registrarse, más info)

REGLAS:
- Diseño con energía y anticipación
- Tipografía impactante para el nombre del evento
- Fecha y hora visibles pero secundarias al nombre
- Colores que evoquen el tipo de evento (fiesta: neón, conferencia: corporativo, cultural: artístico)
- Elementos dinámicos y llamativos

fuente_titulo debe ser una de: "Oswald" | "Montserrat" | "Playfair Display" | "Space Grotesk" | "Bebas Neue"
fuente_cuerpo debe ser una de: "Inter" | "Roboto" | "DM Sans" | "Source Sans Pro" | "Cormorant"

Responde ÚNICAMENTE con JSON sin markdown:
{
  "propuestas": [
    {
      "id": 1,
      "nombre": "nombre evocador del concepto",
      "concepto": "1 línea de atmósfera",
      "background_color": "#hex impactante",
      "background_image_query": "query cinematográfico 6-8 palabras inglés",
      "overlay_color": "#000000",
      "overlay_opacity": 0.55,
      "layout": "centrado | izquierda | derecha",
      "texto_principal": "NOMBRE DEL EVENTO en mayúsculas",
      "texto_secundario": "fecha, hora y lugar",
      "texto_cta": "CTA del evento",
      "color_texto": "#ffffff",
      "color_acento": "#hex vibrante",
      "fuente_titulo": "Bebas Neue",
      "fuente_cuerpo": "Inter",
      "titulo_size": 84,
      "subtitulo_size": 28,
      "elementos_decorativos": [
        { "tipo": "nombre", "color": "#hex", "opacity": 0.8, "posicion": "descripción" }
      ]
    },
    { "id": 2 },
    { "id": 3 }
  ]
}

Las 3 propuestas deben tener layouts DIFERENTES y paletas DIFERENTES.
Cada propuesta debe tener mínimo 3 elementos_decorativos.

FIDELIDAD AL BRIEFING:
- Usa únicamente nombre del evento, fechas, horas, lugar, artista, beneficios y CTA presentes en el briefing.
- NO inventes patrocinadores, artistas, fechas, precios, zonas o promesas no mencionadas.
- Si un dato no está en el briefing, no lo escribas.`;

const PROMPT_GENERICO = `Eres un director de arte senior especializado en digital signage de alto impacto. Tu trabajo es generar especificaciones de diseño que se vean como obra de un diseñador profesional, NO como PowerPoint. Cada diseño debe ser visualmente impactante, moderno y memorable.

REGLAS QUE DEBES SEGUIR SIEMPRE:

FONDOS: Nunca uses blanco o gris claro. Siempre fondos ricos: oscuros profundos (#0a0a0a, #0d1117, #1a0a2e), o colores saturados y valientes (#c0392b, #1a1a2e, #0f3460).

TIPOGRAFÍA con carácter — combina fuentes con contraste extremo:
- Impacto dramático: Oswald + Inter
- Lujo: Playfair Display + Cormorant
- Moderno urbano: Space Grotesk + DM Sans
- Editorial: Bebas Neue + Source Sans Pro
Título principal SIEMPRE en mayúsculas si usas Oswald o Bebas Neue.

JERARQUÍA agresiva:
- Título: 72-96px weight 800
- Subtítulo: 28-36px weight 300 (contraste con el bold del título)
- CTA: 16-20px en badge con color acento

PALETA con alma — máximo 3 colores:
- Dominante oscuro + acento VIBRANTE + neutro blanco/crema
- Acentos que dan vida: #00e5c4, #ff6b35, #ffd700, #e91e8c, #7c3aed, #f97316

ELEMENTOS DECORATIVOS — usa SIEMPRE mínimo 3:
- linea_acento_vertical: línea 3px del color acento, izq del texto
- rectangulo_fondo_texto: rect semitransparente detrás del título
- badge_cta: píldora pequeña arriba del título
- banda_inferior: franja del color acento en 15% inferior canvas
- punto_decorativo: círculo 200-300px semitransparente, fuera del canvas
- linea_horizontal: línea fina entre título y subtítulo
- numero_grande: número enorme opacity 0.06 como fondo decorativo
- overlay_gradiente: negro desde abajo para legibilidad

IMÁGENES DE FONDO — queries cinematográficos y específicos:
MAL → "restaurant food"
BIEN → "dark moody restaurant interior bokeh lights"
MAL → "gym"
BIEN → "athletic silhouette dramatic lighting dark"

Genera 3 propuestas con conceptos y paletas radicalmente diferentes.
Cada una debe verse como diseñada por una persona diferente.

Responde ÚNICAMENTE con este JSON sin markdown:
{
  "propuestas": [
    {
      "id": 1,
      "nombre": "nombre evocador del concepto (ej: Obsidiana, Neón Urbano)",
      "concepto": "1 línea de atmósfera",
      "background_color": "#hex oscuro o saturado",
      "background_image_query": "query cinematográfico 6-8 palabras inglés",
      "overlay_color": "#000000",
      "overlay_opacity": 0.55,
      "layout": "centrado | izquierda | derecha",
      "texto_principal": "TEXTO EN MAYÚSCULAS máx 5 palabras",
      "texto_secundario": "frase evocadora máx 10 palabras",
      "texto_cta": "2-3 palabras acción",
      "color_texto": "#ffffff",
      "color_acento": "#hex vibrante",
      "fuente_titulo": "Oswald",
      "fuente_cuerpo": "Inter",
      "titulo_size": 84,
      "subtitulo_size": 28,
      "elementos_decorativos": [
        {
          "tipo": "nombre del elemento",
          "color": "#hex",
          "opacity": 0.8,
          "posicion": "descripción de posición"
        }
      ]
    },
    { "id": 2 },
    { "id": 3 }
  ]
}

Las 3 propuestas deben tener layouts DIFERENTES (centrado, izquierda, derecha).
fuente_titulo debe ser una de: "Oswald" | "Montserrat" | "Playfair Display" | "Space Grotesk" | "Bebas Neue"
fuente_cuerpo debe ser una de: "Inter" | "Roboto" | "DM Sans" | "Source Sans Pro" | "Cormorant"
Cada propuesta debe tener mínimo 3 elementos_decorativos diferentes.`;

type DetectedType = "menu" | "promo" | "bienvenida" | "evento" | "generico";

type MenuItem = {
  name: string;
  description?: string | null;
  price?: number | string | null;
  currency?: string | null;
  category?: string | null;
  sort_order?: number | null;
};

type BrandKit = {
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  font_family?: string | null;
  logo_url?: string | null;
};

/** Colombian price format: $12.900 — no decimals, dot as thousands separator. */
const formatCOP = (value: number | string | null | undefined) => {
  const num = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(num)) return "";
  return `$${Math.round(num).toLocaleString("es-CO", { maximumFractionDigits: 0 }).replace(/,/g, ".")}`;
};

/** Groups real menu items by category, preserving sort_order inside each group. */
const buildRealSections = (items: MenuItem[]) => {
  const groups = new Map<string, { plato: string; descripcion: string; precio: string }[]>();
  for (const item of items) {
    const key = (item.category ?? "").trim() || "Menú";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      plato: item.name,
      descripcion: item.description ?? "",
      precio: formatCOP(item.price),
    });
  }
  return [...groups.entries()].map(([nombre, itemsGrupo]) => ({ nombre, items: itemsGrupo }));
};

const buildMenuBlock = (sections: ReturnType<typeof buildRealSections>) =>
  sections
    .map(
      (s) =>
        `SECCIÓN "${s.nombre}":\n` +
        s.items.map((i) => `  - ${i.plato} | ${i.descripcion || "sin descripción"} | ${i.precio}`).join("\n"),
    )
    .join("\n");

const normalizeText = (value: string = "") =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");


const extractBriefingFacts = (prompt: string, cliente: string) => {
  const combined = `${cliente ? `Cliente: ${cliente}. ` : ""}${prompt}`.trim();
  const unique = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter(Boolean))];

  const quoted = unique(Array.from(combined.matchAll(/["“”']([^"“”']{2,80})["“”']/g), (m) => m[1]));
  const percentages = unique(Array.from(combined.matchAll(/\b\d{1,3}\s?%/g), (m) => m[0]));
  const prices = unique(Array.from(combined.matchAll(/\$\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/g), (m) => m[0].replace(/\s+/g, " ")));
  const dates = unique(Array.from(combined.matchAll(/\b(?:lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|\d{1,2}\s+de\s+[a-záéíóú]+|\d{1,2}\s*(?:-|al)\s*\d{1,2}\s+de\s+[a-záéíóú]+)\b/gi), (m) => m[0]));
  const times = unique(Array.from(combined.matchAll(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi), (m) => m[0]));
  const brands = unique(Array.from(combined.matchAll(/\b(?:nike|adidas|puma|reebok|sportzone|acqua(?:\s+centro\s+comercial)?|centro comercial acqua|ibague|ibagué)\b/gi), (m) => m[0]));
  const benefits = unique(Array.from(combined.matchAll(/\b(?:entrada libre|parqueadero gratis(?: las primeras \d+ horas)?|delivery disponible|domicilio|solo hoy|solo fin de semana|solo sabado y domingo|solo sábado y domingo)\b/gi), (m) => m[0]));
  const colors = unique(Array.from(combined.matchAll(/\b(?:rojo|azul|verde|negro|blanco|dorado|plateado|naranja|amarillo|morado|fucsia|rosa|gris|azul electrico|azul eléctrico)\b/gi), (m) => m[0]));
  const sentences = combined
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 6)
    .slice(0, 8);

  return { quoted, percentages, prices, dates, times, brands, benefits, colors, sentences };
};

const buildFactsBlock = (facts: ReturnType<typeof extractBriefingFacts>) => {
  const sections = [
    ["Frases literales", facts.quoted],
    ["Porcentajes", facts.percentages],
    ["Precios", facts.prices],
    ["Fechas", facts.dates],
    ["Horas", facts.times],
    ["Marcas / nombres propios", facts.brands],
    ["Beneficios / condiciones", facts.benefits],
    ["Colores mencionados", facts.colors],
    ["Hechos del briefing", facts.sentences],
  ].filter(([, values]) => Array.isArray(values) && values.length > 0);

  if (sections.length === 0) return "- No se extrajeron hechos estructurados; usa solo el briefing literal.";

  return sections
    .map(([label, values]) => `- ${label}: ${(values as string[]).join(" | ")}`)
    .join("\n");
};

const parseModelJson = (text: string) => {
  const trimmed = text.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, ""),
  ];

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  throw new Error("Respuesta IA inválida");
};

const callAnthropicJson = async ({
  apiKey,
  system,
  user,
}: {
  apiKey: string;
  system: string;
  user: string;
}) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Anthropic error:", response.status, errText);
    throw new Error("Error al generar diseño");
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  try {
    return parseModelJson(text);
  } catch {
    console.error("Failed to parse Claude JSON:", text.substring(0, 500));
    throw new Error("Respuesta IA inválida");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, tipo, formato, estilo, cliente, menu_items, brand_kit, arquetipos } = await req.json();
    // The archetype the user picks most often is generated first.
    const archetypeOrder: ArchetypeId[] = normalizeArchetypeOrder(arquetipos);
    const menuItems: MenuItem[] = Array.isArray(menu_items)
      ? menu_items.filter((i: MenuItem) => i && typeof i.name === "string" && i.name.trim()).slice(0, TV_RULES.maxItems)
      : [];
    const brandKit: BrandKit | null = brand_kit && typeof brand_kit === "object" ? brand_kit : null;
    const realSections = buildRealSections(menuItems);
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_ACCESS_KEY) throw new Error("UNSPLASH_ACCESS_KEY is not configured");

    const tipoNormalizado = normalizeText(tipo);
    const promptNormalizado = normalizeText(`${prompt} ${cliente}`);
    const briefingFacts = extractBriefingFacts(prompt, cliente);
    const factsBlock = buildFactsBlock(briefingFacts);
    // Keywords for each type - scored by match count to pick best fit
    const typePatterns: { type: DetectedType; regex: RegExp }[] = [
      { type: "menu", regex: /\b(menu|plato|platos|entradas|postres|almuerzo ejecutivo|carta|restaurante|comida|cocina)\b/g },
      { type: "promo", regex: /\b(promocion|promo|descuento|oferta|\d+%\s*off|rebaja|solo hoy|ultimas unidades)\b/g },
      { type: "bienvenida", regex: /\b(bienvenida|bienvenido|welcome|recepcion|lobby)\b/g },
      { type: "evento", regex: /\b(evento|concierto|festival|fest|conferencia|seminario|show en vivo|show|fecha|lugar|entrada libre|entrada|feria|inauguracion|aniversario)\b/g },
    ];

    let detectedType: DetectedType = "generico";

    const isGenericType = !tipoNormalizado || tipoNormalizado === "digital signage" || tipoNormalizado === "digitalsignage";

    if (tipoNormalizado === "menu" || tipoNormalizado === "menú" || tipoNormalizado.startsWith("menu")) {
      detectedType = "menu";
    } else if (tipoNormalizado.startsWith("promoc")) {
      detectedType = "promo";
    } else if (tipoNormalizado.startsWith("bienv")) {
      detectedType = "bienvenida";
    } else if (tipoNormalizado.startsWith("event")) {
      detectedType = "evento";
    } else if (isGenericType) {
      // Score each type by keyword match count — highest wins
      let bestType: DetectedType = "generico";
      let bestScore = 0;
      for (const { type, regex } of typePatterns) {
        const matches = promptNormalizado.match(regex);
        const score = matches ? matches.length : 0;
        if (score > bestScore) {
          bestScore = score;
          bestType = type;
        }
      }
      detectedType = bestType;
    }

    console.log("TIPO RECIBIDO:", tipo);
    console.log("TIPO NORMALIZADO:", tipoNormalizado);
    console.log("TIPO DETECTADO:", detectedType);

    // Never invent menu content: a menu design with fake dishes is worse than no design.
    if (detectedType === "menu" && menuItems.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Tu menú aún no tiene platos activos. Carga el menú antes de generar la pieza.",
          code: "MENU_EMPTY",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const basePrompt = detectedType === "menu" ? PROMPT_MENU
      : detectedType === "promo" ? PROMPT_PROMO
      : detectedType === "bienvenida" ? PROMPT_BIENVENIDA
      : detectedType === "evento" ? PROMPT_EVENTO
      : PROMPT_GENERICO;
    const systemPrompt = `${basePrompt}\n${TV_LEGIBILITY_RULES}\n${buildArchetypePrompt(archetypeOrder)}`;

    const canvas = CANVAS[(formato as keyof typeof CANVAS)] ?? CANVAS["16:9"];
    const typo = tvTypography(canvas.h, canvas.w);

    console.log("USANDO PROMPT:", detectedType.toUpperCase());

    const menuBlock = realSections.length
      ? `
DATOS REALES DEL MENÚ DEL NEGOCIO — OBLIGATORIOS, NO LOS MODIFIQUES:
${buildMenuBlock(realSections)}

REGLAS DEL MENÚ:
- Usa EXACTAMENTE estos nombres, descripciones y precios en "secciones".
- Respeta el orden y las secciones tal como aparecen arriba.
- Los precios son obligatorios y ya vienen en formato colombiano ($12.900). No los recalcules ni les agregues decimales.
- PROHIBIDO inventar platos, precios o descripciones que no estén en esta lista.
`
      : "";

    const brandBlock = brandKit
      ? `
BRAND KIT DEL NEGOCIO — APLÍCALO DESDE LA GENERACIÓN:
- Color primario (acento): ${brandKit.primary_color ?? "no definido"}
- Color secundario (fondo): ${brandKit.secondary_color ?? "no definido"}
- Color de realce: ${brandKit.accent_color ?? "no definido"}
- Tipografía de marca: ${brandKit.font_family ?? "no definida"}
Usa estos colores en background_color, color_acento y color_texto manteniendo buen contraste.
`
      : "";

    const userPrompt = `
BRIEFING DEL CLIENTE — SIGUE ESTAS INSTRUCCIONES AL PIE DE LA LETRA:

Cliente: ${cliente || 'Sin nombre'}
Descripción exacta del cliente: "${prompt}"
Tipo de contenido: ${tipo}
Formato de pantalla: ${formato}
Estilo visual solicitado: ${estilo}
${menuBlock}${brandBlock}
OBLIGATORIO:
- El texto_principal DEBE referirse directamente a: "${prompt}"
- El texto_secundario DEBE complementar la descripción del cliente
- El background_image_query DEBE buscar imágenes relacionadas con: "${prompt}"
- Los 3 conceptos deben interpretar "${prompt}" de formas distintas
- Si el cliente mencionó colores específicos, úsalos como color_acento
- Si mencionó un negocio específico, el diseño debe evocar ESE negocio
- Usa como fuente de verdad estos hechos extraídos del briefing:
${factsBlock}
- Si un dato no está en el briefing o en la lista de hechos, NO lo escribas
- Conserva literalmente porcentajes, precios, fechas, horas, nombres de eventos, marcas y beneficios cuando existan

PROHIBIDO:
- Inventar un negocio diferente al descrito
- Usar textos genéricos que no tengan relación con la descripción
- Repetir el mismo concepto visual en las 3 propuestas
- Usar placeholders literales como "TEXTO PRINCIPAL", "Subtítulo del diseño", "Ver más", "Lorem ipsum"
- Alterar cifras, precios, porcentajes, fechas, horas o marcas del briefing
- Añadir claims, promociones, artistas, zonas, slogans o condiciones que el cliente no mencionó
- Inventar platos o precios cuando se entregaron datos reales del menú

Genera las 3 propuestas ahora.
`;


    const runGeneration = async (feedback: string): Promise<any[]> => {
    const parsed = await callAnthropicJson({
      apiKey: ANTHROPIC_API_KEY,
      system: systemPrompt,
      user: feedback
        ? `${userPrompt}\n\nCORRECCIÓN OBLIGATORIA — el intento anterior fue RECHAZADO por el validador de legibilidad en televisor:\n${feedback}\nCorrige estos puntos: menos platos si hace falta, descripciones más cortas, más contraste y tipografía por encima de los mínimos.`
        : userPrompt,
    });
    console.log("RESPUESTA CLAUDE (parsed OK):", JSON.stringify(parsed).substring(0, 500));

    let audited = parsed;
    try {
      audited = await callAnthropicJson({
        apiKey: ANTHROPIC_API_KEY,
        system: `Eres un auditor de fidelidad de briefing para piezas de digital signage.
Recibirás un briefing y un JSON de propuestas.
Debes devolver JSON válido con la MISMA estructura, corrigiendo cualquier dato que no esté respaldado por el briefing.

REGLAS:
- NO inventes nuevos hechos.
- NO cambies cifras correctas del briefing.
- Si una propuesta incluye marcas, beneficios, fechas, horas, precios, porcentajes o claims no respaldados, elimínalos o reescríbelos con información sí respaldada.
- Mantén el tono creativo, pero prioriza la exactitud factual sobre el estilo.
- Devuelve solo JSON.`,
        user: `BRIEFING ORIGINAL:\n${prompt}\n\nCLIENTE: ${cliente || "Sin nombre"}\nTIPO: ${tipo}\nHECHOS EXTRAÍDOS:\n${factsBlock}\n\nJSON PROPUESTO A AUDITAR:\n${JSON.stringify(parsed)}`,
      });
      console.log("RESPUESTA AUDITADA (parsed OK):", JSON.stringify(audited).substring(0, 500));
    } catch (auditError) {
      console.error("Audit pass failed, using original parsed proposals:", auditError);
    }

    const propuestas = audited.propuestas ?? [audited];
    const validTitleFonts = ["Oswald", "Montserrat", "Playfair Display", "Space Grotesk", "Bebas Neue"];
    const validBodyFonts = ["Inter", "Roboto", "DM Sans", "Source Sans Pro", "Cormorant"];
    const validLayouts = ["centrado", "izquierda", "derecha"];
    const isPlaceholderText = (value: unknown) => {
      if (typeof value !== "string") return true;
      const normalized = normalizeText(value).trim();
      return !normalized || ["texto principal", "subtitulo del diseno", "subtitulo del diseño", "ver mas", "ver más", "lorem ipsum"].includes(normalized);
    };

    const sanitized = propuestas.slice(0, 3).map((p: any, i: number) => {
      const isMenuResponse = detectedType === "menu";
      const archetypeId = archetypeOrder[i] ?? archetypeOrder[0];
      const archetype = ARCHETYPES[archetypeId];
      const rawSections = Array.isArray(p.secciones)
        ? p.secciones.map((s: any) => ({
            nombre: s.nombre ?? "",
            items: Array.isArray(s.items)
              ? s.items.map((it: any) => ({
                  plato: it.plato ?? "",
                  descripcion: it.descripcion ?? "",
                  precio: it.precio ?? "",
                }))
              : [],
          }))
        : null;

      const hasValidSections = Array.isArray(rawSections)
        && rawSections.length > 0
        && rawSections.some((section) => Array.isArray(section.items)
          && section.items.some((item) => !isPlaceholderText(item.plato) || !isPlaceholderText(item.precio)));
      // El título de la pieza es la marca del negocio; "Menú del día" solo es subtítulo.
      const modelTitle = (p.header?.nombre_restaurante ?? "").trim();
      const esTituloGenerico = /^(menu|menú)( del d[ií]a)?$/i.test(modelTitle);
      const normalizedHeader = {
        nombre_restaurante: (cliente || (!esTituloGenerico ? modelTitle : "") || (!isPlaceholderText(p.texto_principal) ? p.texto_principal : "")).trim(),
        tagline: (p.header?.tagline || (esTituloGenerico ? modelTitle : "") || (!isPlaceholderText(p.texto_secundario) ? p.texto_secundario : "")).trim(),
        size: p.header?.size ?? typo.restaurante,
      };
      // Real menu data always wins over anything the model wrote.
      const normalizedSections = realSections.length
        ? realSections
        : (hasValidSections ? rawSections : []);
      const normalizedFooter = p.footer_texto ?? (isPlaceholderText(p.texto_cta) ? null : p.texto_cta) ?? null;

      console.log("RESPUESTA CLAUDE:", JSON.stringify({
        id: p.id ?? i + 1,
        tipo_layout: p.tipo_layout ?? null,
        header: normalizedHeader,
        secciones_count: normalizedSections.length,
        footer_texto: normalizedFooter,
      }));

      return enforceArchetype({
        id: i + 1,
        nombre: p.nombre ?? archetype.label,
        arquetipo: archetypeId,
        concepto: p.concepto ?? "",
        tipo_layout: archetypeId,
        background_color: brandKit?.secondary_color ?? p.background_color ?? "#0a0a0a",
        background_image_query: p.background_image_query ?? "",
        overlay_color: p.overlay_color ?? "#000000",
        overlay_opacity: Math.min(
          OVERLAY_RANGE.max,
          Math.max(OVERLAY_RANGE.min, typeof p.overlay_opacity === "number" ? p.overlay_opacity : 0.55),
        ),
        logo_url: brandKit?.logo_url ?? null,
        layout: validLayouts.includes(p.layout) ? p.layout : "centrado",
        texto_principal: isMenuResponse
          ? normalizedHeader.nombre_restaurante
          : (isPlaceholderText(p.texto_principal) ? (cliente || `Propuesta ${i + 1}`) : p.texto_principal),
        texto_secundario: isMenuResponse
          ? normalizedHeader.tagline
          : (isPlaceholderText(p.texto_secundario) ? (p.concepto ?? "Diseño personalizado") : p.texto_secundario),
        texto_cta: isMenuResponse
          ? (normalizedFooter ?? "")
          : (isPlaceholderText(p.texto_cta) ? "Descubre más" : p.texto_cta),
        color_texto: p.color_texto ?? "#FFFFFF",
        color_acento: brandKit?.accent_color ?? brandKit?.primary_color ?? p.color_acento ?? "#00e5c4",
        fuente_titulo: validTitleFonts.includes(p.fuente_titulo) ? p.fuente_titulo : "Oswald",
        fuente_cuerpo: validBodyFonts.includes(p.fuente_cuerpo) ? p.fuente_cuerpo : "Inter",
        titulo_size: typeof p.titulo_size === "number" ? p.titulo_size : 84,
        subtitulo_size: typeof p.subtitulo_size === "number" ? p.subtitulo_size : 28,
        elementos: Array.isArray(p.elementos) ? p.elementos : [],
        elementos_decorativos: Array.isArray(p.elementos_decorativos)
          ? p.elementos_decorativos.map((ed: any) => ({
              tipo: ed.tipo ?? "",
              color: ed.color ?? "#ffffff",
              opacity: typeof ed.opacity === "number" ? ed.opacity : 0.5,
              posicion: ed.posicion ?? "",
            }))
          : [],
        header: isMenuResponse ? normalizedHeader : (p.header ?? null),
        secciones: isMenuResponse ? normalizedSections : rawSections,
        footer_texto: isMenuResponse ? normalizedFooter : (p.footer_texto ?? null),
      }, archetypeId);
    });
    return sanitized;
    };

    const orientation = formato === "9:16" ? "portrait" : "landscape";

    /** Unsplash lookup with explicit lighting requirements — never a dark scene. */
    const attachImage = async (p: any) => {
      if (!ARCHETYPES[p.arquetipo as ArchetypeId]?.usaFoto) {
        console.log("IMAGEN: arquetipo sin foto", p.arquetipo);
        return { ...p, image_url: null };
      }
      const query = `${p.background_image_query || "restaurant food"} ${IMAGE_LIGHT_TERMS}`.trim();
      const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=${orientation}&content_filter=high`;
      console.log("IMAGEN → petición:", JSON.stringify({ arquetipo: p.arquetipo, query }));
      try {
        const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
        if (!res.ok) {
          console.error("IMAGEN ← fallo Unsplash:", res.status, (await res.text()).slice(0, 200));
          return { ...p, image_url: null, image_error: `unsplash_${res.status}` };
        }
        const data = await res.json();
        const imageUrl = data.urls?.regular || null;
        console.log("IMAGEN ← respuesta:", JSON.stringify({ arquetipo: p.arquetipo, ok: !!imageUrl, id: data.id ?? null }));
        return { ...p, image_url: imageUrl, image_error: imageUrl ? null : "unsplash_empty" };
      } catch (err) {
        console.error("IMAGEN ← excepción Unsplash:", err);
        return { ...p, image_url: null, image_error: "unsplash_exception" };
      }
    };

    const brandForNormalize = {
      primary: brandKit?.primary_color ?? null,
      accent: brandKit?.accent_color ?? null,
      secondary: brandKit?.secondary_color ?? null,
      logo_url: brandKit?.logo_url ?? null,
    };

    /**
     * Stage 2 — validation ALWAYS runs between the model response and the render.
     * Nothing is returned to the client without passing validarPropuesta().
     */
    const buildAttempt = async (feedbackText: string, attempt: number) => {
      const candidates = await runGeneration(feedbackText);
      const withImages = await Promise.all(candidates.map(attachImage));
      const prepared = withImages.map((p: any) =>
        normalizeProposalVisuals(
          enforceArchetype(enforceTvProposal(p, canvas.h, canvas.w), p.arquetipo as ArchetypeId),
          brandForNormalize,
        ),
      );
      const results = prepared.map((p: any) => {
        const result = validarPropuesta(p, canvas.w, canvas.h);
        logViolations(attempt, p.id ?? "?", result.violaciones);
        return { propuesta: p, result };
      });
      return results;
    };

    let attemptResults = await buildAttempt("", 1);
    let failed = attemptResults.filter((r) => !r.result.ok);

    if (failed.length > 0) {
      // Retry ONCE with the concrete list of broken rules and the returned values.
      const feedback = failed
        .map((r) =>
          `- Propuesta ${r.propuesta.id} (${r.propuesta.arquetipo}):\n` +
          r.result.violaciones.map((x) => `   · ${x.regla}: ${x.detalle}${x.valor !== undefined ? ` (valor devuelto: ${x.valor})` : ""}`).join("\n"),
        )
        .join("\n");
      console.warn("VALIDACIÓN intento 1 — reglas incumplidas:\n" + feedback);
      const second = await buildAttempt(feedback, 2);
      const okSecond = second.filter((r) => r.result.ok);
      const okFirst = attemptResults.filter((r) => r.result.ok);
      // Keep whatever passed, from either attempt; discard the rest.
      const byArchetype = new Map<string, any>();
      for (const r of [...okFirst, ...okSecond]) byArchetype.set(r.propuesta.arquetipo, r);
      attemptResults = [...byArchetype.values()];
      const descartadas = second.filter((r) => !r.result.ok).map((r) => r.propuesta.arquetipo);
      if (descartadas.length) console.warn("VALIDACIÓN intento 2 — propuestas descartadas:", descartadas.join(", "));
    }

    const finalProposals = attemptResults
      .filter((r) => r.result.ok)
      .map((r, i) => ({ ...r.propuesta, id: i + 1 }));

    return new Response(
      JSON.stringify({ propuestas: finalProposals, tv_typography: typo }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-design error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

