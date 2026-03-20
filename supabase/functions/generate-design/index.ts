import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, tipo, formato, estilo, cliente } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_ACCESS_KEY) throw new Error("UNSPLASH_ACCESS_KEY is not configured");

    const systemPrompt = `Eres un director de arte senior especializado en digital signage de alto impacto. Tu trabajo es generar especificaciones de diseño que se vean como obra de un diseñador profesional, NO como PowerPoint. Cada diseño debe ser visualmente impactante, moderno y memorable.

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
    { "id": 2, ... },
    { "id": 3, ... }
  ]
}

Las 3 propuestas deben tener layouts DIFERENTES (centrado, izquierda, derecha).
fuente_titulo debe ser una de: "Oswald" | "Montserrat" | "Playfair Display" | "Space Grotesk" | "Bebas Neue"
fuente_cuerpo debe ser una de: "Inter" | "Roboto" | "DM Sans" | "Source Sans Pro" | "Cormorant"
Cada propuesta debe tener mínimo 3 elementos_decorativos diferentes.`;

    const userPrompt = `Diseño: ${prompt}
Tipo: ${tipo}
Formato: ${formato}
Estilo: ${estilo}
${cliente ? `Cliente: ${cliente}` : ""}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Error al generar diseño" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    let parsed;
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude JSON:", text);
      return new Response(JSON.stringify({ error: "Respuesta IA inválida" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propuestas = parsed.propuestas ?? [parsed];
    const validTitleFonts = ["Oswald", "Montserrat", "Playfair Display", "Space Grotesk", "Bebas Neue"];
    const validBodyFonts = ["Inter", "Roboto", "DM Sans", "Source Sans Pro", "Cormorant"];
    const validLayouts = ["centrado", "izquierda", "derecha"];

    const sanitized = propuestas.slice(0, 3).map((p: any, i: number) => ({
      id: i + 1,
      nombre: p.nombre ?? `Propuesta ${i + 1}`,
      concepto: p.concepto ?? "",
      background_color: p.background_color ?? "#0a0a0a",
      background_image_query: p.background_image_query ?? "",
      overlay_color: p.overlay_color ?? "#000000",
      overlay_opacity: typeof p.overlay_opacity === "number" ? p.overlay_opacity : 0.55,
      layout: validLayouts.includes(p.layout) ? p.layout : "centrado",
      texto_principal: p.texto_principal ?? "TEXTO PRINCIPAL",
      texto_secundario: p.texto_secundario ?? "Subtítulo del diseño",
      texto_cta: p.texto_cta ?? "Ver más",
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
    }));

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
