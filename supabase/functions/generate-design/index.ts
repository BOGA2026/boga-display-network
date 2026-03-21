import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
- Nombre del plato: bold 22-28px
- Descripción: italic light 14-16px, color gris claro
- Precio: bold 20-24px, color acento
- Separador horizontal entre secciones
- Nombre del restaurante arriba: 48-56px bold

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
      model: "claude-sonnet-4-20250514",
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
    const { prompt, tipo, formato, estilo, cliente } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_ACCESS_KEY) throw new Error("UNSPLASH_ACCESS_KEY is not configured");

    const tipoNormalizado = normalizeText(tipo);
    const promptNormalizado = normalizeText(`${prompt} ${cliente}`);
    const briefingFacts = extractBriefingFacts(prompt, cliente);
    const factsBlock = buildFactsBlock(briefingFacts);
    const menuKeywords = /(menu|plato|platos|entradas|bebidas|postres|precio|precios|almuerzo ejecutivo|carta)/;
    const promoKeywords = /(promocion|promo|descuento|oferta|off|rebaja|solo hoy|ultimas unidades)/;
    const bienvenidaKeywords = /(bienvenida|bienvenido|welcome|recepcion|lobby)/;
    const eventoKeywords = /(evento|concierto|festival|conferencia|seminario|show|fecha|hora|lugar)/;

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
      if (menuKeywords.test(promptNormalizado)) {
        detectedType = "menu";
      } else if (promoKeywords.test(promptNormalizado)) {
        detectedType = "promo";
      } else if (bienvenidaKeywords.test(promptNormalizado)) {
        detectedType = "bienvenida";
      } else if (eventoKeywords.test(promptNormalizado)) {
        detectedType = "evento";
      }
    }

    console.log("TIPO RECIBIDO:", tipo);
    console.log("TIPO NORMALIZADO:", tipoNormalizado);
    console.log("TIPO DETECTADO:", detectedType);

    const systemPrompt = detectedType === "menu" ? PROMPT_MENU
      : detectedType === "promo" ? PROMPT_PROMO
      : detectedType === "bienvenida" ? PROMPT_BIENVENIDA
      : detectedType === "evento" ? PROMPT_EVENTO
      : PROMPT_GENERICO;

    console.log("USANDO PROMPT:", detectedType.toUpperCase());

    const userPrompt = `
BRIEFING DEL CLIENTE — SIGUE ESTAS INSTRUCCIONES AL PIE DE LA LETRA:

Cliente: ${cliente || 'Sin nombre'}
Descripción exacta del cliente: "${prompt}"
Tipo de contenido: ${tipo}
Formato de pantalla: ${formato}
Estilo visual solicitado: ${estilo}

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

Genera las 3 propuestas ahora.
`;

    const parsed = await callAnthropicJson({
      apiKey: ANTHROPIC_API_KEY,
      system: systemPrompt,
      user: userPrompt,
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
      const normalizedHeader = {
        nombre_restaurante: p.header?.nombre_restaurante ?? cliente ?? (!isPlaceholderText(p.texto_principal) ? p.texto_principal : ""),
        tagline: p.header?.tagline ?? (!isPlaceholderText(p.texto_secundario) ? p.texto_secundario : ""),
        size: p.header?.size ?? 48,
      };
      const normalizedSections = hasValidSections ? rawSections : [];
      const normalizedFooter = p.footer_texto ?? (isPlaceholderText(p.texto_cta) ? null : p.texto_cta) ?? null;

      console.log("RESPUESTA CLAUDE:", JSON.stringify({
        id: p.id ?? i + 1,
        tipo_layout: p.tipo_layout ?? null,
        header: normalizedHeader,
        secciones_count: normalizedSections.length,
        footer_texto: normalizedFooter,
      }));

      return {
        id: i + 1,
        nombre: p.nombre ?? `Propuesta ${i + 1}`,
        concepto: p.concepto ?? "",
        tipo_layout: isMenuResponse && normalizedSections.length > 0 ? "menu_dos_columnas" : (p.tipo_layout ?? null),
        background_color: p.background_color ?? "#0a0a0a",
        background_image_query: p.background_image_query ?? "",
        overlay_color: p.overlay_color ?? "#000000",
        overlay_opacity: typeof p.overlay_opacity === "number" ? p.overlay_opacity : 0.55,
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
        color_acento: p.color_acento ?? "#00e5c4",
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
      };
    });

    // Fetch Unsplash images for each proposal
    const orientation = formato === "9:16" ? "portrait" : "landscape";
    const withImages = await Promise.all(
      sanitized.map(async (p: any) => {
        if (!p.background_image_query) return { ...p, image_url: null };
        try {
          const unsplashRes = await fetch(
            `https://api.unsplash.com/photos/random?query=${encodeURIComponent(p.background_image_query)}&orientation=${orientation}`,
            { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
          );
          if (!unsplashRes.ok) {
            console.error("Unsplash error:", unsplashRes.status);
            return { ...p, image_url: null };
          }
          const unsplashData = await unsplashRes.json();
          return { ...p, image_url: unsplashData.urls?.regular || null };
        } catch (err) {
          console.error("Unsplash fetch failed:", err);
          return { ...p, image_url: null };
        }
      })
    );

    return new Response(
      JSON.stringify({ propuestas: withImages }),
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
