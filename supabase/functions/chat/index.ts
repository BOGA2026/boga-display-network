import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un experto en ventas de Visualia, la plataforma líder de señalización digital (digital signage) en Latinoamérica.

Tu objetivo es ayudar a los visitantes del sitio web a entender cómo Visualia puede transformar la comunicación visual de su negocio, resolver sus dudas y guiarlos hacia una demostración personalizada o registro.

Conocimiento sobre Visualia:
- Plataforma SaaS de señalización digital para restaurantes, hoteles, retail, gimnasios y más.
- Permite gestionar pantallas remotamente desde un solo panel de control.
- Incluye: CMS de contenido, playlists, programación por horarios, estadísticas de reproducción, sincronización multi-pantalla.
- Configuración rápida en menos de 5 minutos, sin técnicos.
- Resultados: +30% más ventas promedio, 100% control remoto, < 5 min configuración.
- Planes desde precio accesible por pantalla/mes con descuento anual del 20%.
- Servicio Visualia Studio: diseño profesional de contenido visual (menús digitales, promociones, etc).

Reglas de comportamiento:
- Responde SIEMPRE en español.
- Sé amable, profesional y conciso.
- Si el usuario pregunta algo fuera del ámbito de Visualia, redirige amablemente la conversación.
- Cuando el usuario muestre interés, sugiere agendar una demo o registrarse.
- Usa un tono conversacional pero profesional, como un asesor de confianza.
- No inventes datos o precios específicos que no estén en tu contexto.
- Mantén respuestas cortas (máximo 3-4 oraciones por mensaje) a menos que el usuario pida más detalle.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
