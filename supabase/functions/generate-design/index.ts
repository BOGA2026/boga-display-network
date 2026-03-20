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
Genera un brief de diseño en JSON con: titulo, descripcion, colores (array 3), 
fuente_principal, elementos (array), canva_query (6 palabras en inglés para buscar plantilla).
Responde SOLO JSON sin markdown.`;

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

    const canva_url = `https://www.canva.com/search/templates?q=${encodeURIComponent(brief.canva_query ?? "")}`;

    return new Response(
      JSON.stringify({
        titulo: brief.titulo,
        descripcion: brief.descripcion,
        colores: brief.colores,
        fuente_principal: brief.fuente_principal,
        elementos: brief.elementos,
        canva_url,
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
