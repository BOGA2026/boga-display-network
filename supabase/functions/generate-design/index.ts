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
Genera un brief de diseño en JSON con exactamente estos campos:
- titulo: nombre del diseño (string)
- descripcion: descripción breve del diseño (string)
- background_color: color de fondo hexadecimal (string, ej: "#1A1A2E")
- texto_principal: texto destacado del diseño, MÁXIMO 6 palabras (string)
- texto_secundario: subtítulo o texto de apoyo, MÁXIMO 12 palabras (string)
- color_texto: color del texto hexadecimal (string, ej: "#FFFFFF")
- color_acento: color de acento hexadecimal (string, ej: "#E94560")
- fuente: una de estas opciones EXACTAS: "Inter" | "Roboto" | "Montserrat" | "Oswald" | "Playfair Display"

Responde SOLO el objeto JSON, sin markdown, sin backticks, sin explicación.`;

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
        max_tokens: 1024,
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

    let brief;
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      brief = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude JSON:", text);
      return new Response(JSON.stringify({ error: "Respuesta IA inválida" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validFonts = ["Inter", "Roboto", "Montserrat", "Oswald", "Playfair Display"];
    const fuente = validFonts.includes(brief.fuente) ? brief.fuente : "Inter";

    return new Response(
      JSON.stringify({
        titulo: brief.titulo ?? "Diseño sin título",
        descripcion: brief.descripcion ?? "",
        background_color: brief.background_color ?? "#1A1A2E",
        texto_principal: brief.texto_principal ?? "Texto Principal",
        texto_secundario: brief.texto_secundario ?? "Subtítulo del diseño",
        color_texto: brief.color_texto ?? "#FFFFFF",
        color_acento: brief.color_acento ?? "#E94560",
        fuente,
      }),
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