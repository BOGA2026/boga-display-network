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

    const systemPrompt = `Eres el asistente de diseño de Visualia, empresa de señalización digital.
Genera EXACTAMENTE 3 propuestas de diseño diferentes en JSON.

REGLAS DE COMPOSICIÓN:
- Regla de tercios: texto principal en tercio superior o inferior
- Jerarquía tipográfica: titulo 60px bold > subtítulo 26px regular > CTA 18px
- Layout "izquierda": textos alineados a la izquierda con padding 10% desde el borde
- Layout "derecha": textos alineados a la derecha
- Layout "centrado": todo centrado, espaciado generoso
- Cada propuesta DEBE tener combinación de colores DIFERENTE
- texto_principal: MÁXIMO 6 palabras impactantes
- texto_secundario: MÁXIMO 12 palabras descriptivas
- texto_cta: MÁXIMO 3 palabras (ej: "Visítanos hoy", "Llama ahora", "Reserva ya")
- background_image_query: 3-5 palabras en inglés para buscar foto en Unsplash
- elementos disponibles: "rectangulo_acento" (barra de color 8px en borde), "linea_divisora" (línea entre título y subtítulo), "badge_superior" (rectángulo redondeado con CTA arriba)

Formato JSON EXACTO (responde SOLO este JSON, sin markdown):
{
  "propuestas": [
    {
      "id": 1,
      "nombre": "Nombre estilo (ej: Minimalista)",
      "background_color": "#hex",
      "background_image_query": "english search terms",
      "overlay_opacity": 0.5,
      "layout": "centrado",
      "texto_principal": "Texto Grande",
      "texto_secundario": "Texto secundario descriptivo",
      "texto_cta": "Acción",
      "color_texto": "#hex",
      "color_acento": "#hex",
      "fuente_titulo": "Oswald",
      "fuente_cuerpo": "Inter",
      "elementos": ["rectangulo_acento"]
    },
    { "id": 2, "nombre": "...", "layout": "izquierda", ... },
    { "id": 3, "nombre": "...", "layout": "derecha", ... }
  ]
}

Las 3 propuestas deben tener layouts DIFERENTES (centrado, izquierda, derecha).
fuente_titulo debe ser una de: "Oswald" | "Montserrat" | "Playfair Display"
fuente_cuerpo debe ser una de: "Inter" | "Roboto"`;

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
        max_tokens: 2048,
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
    const validTitleFonts = ["Oswald", "Montserrat", "Playfair Display"];
    const validBodyFonts = ["Inter", "Roboto"];
    const validLayouts = ["centrado", "izquierda", "derecha"];

    const sanitized = propuestas.slice(0, 3).map((p: any, i: number) => ({
      id: i + 1,
      nombre: p.nombre ?? `Propuesta ${i + 1}`,
      background_color: p.background_color ?? "#1A1A2E",
      background_image_query: p.background_image_query ?? "",
      overlay_opacity: typeof p.overlay_opacity === "number" ? p.overlay_opacity : 0.5,
      layout: validLayouts.includes(p.layout) ? p.layout : "centrado",
      texto_principal: p.texto_principal ?? "Texto Principal",
      texto_secundario: p.texto_secundario ?? "Subtítulo del diseño",
      texto_cta: p.texto_cta ?? "Ver más",
      color_texto: p.color_texto ?? "#FFFFFF",
      color_acento: p.color_acento ?? "#E94560",
      fuente_titulo: validTitleFonts.includes(p.fuente_titulo) ? p.fuente_titulo : "Montserrat",
      fuente_cuerpo: validBodyFonts.includes(p.fuente_cuerpo) ? p.fuente_cuerpo : "Inter",
      elementos: Array.isArray(p.elementos) ? p.elementos : [],
    }));

    return new Response(
      JSON.stringify({ propuestas: sanitized }),
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