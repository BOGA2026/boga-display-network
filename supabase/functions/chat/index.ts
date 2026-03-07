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
- Usa un tono conversacional pero profesional, como un asesor de confianza.
- No inventes datos o precios específicos que no estén en tu contexto.
- Mantén respuestas cortas (máximo 3-4 oraciones por mensaje) a menos que el usuario pida más detalle.

REGLA CRÍTICA DE CAPTACIÓN DE LEADS:
Cuando detectes que el usuario muestra interés real en Visualia (pregunta por precios, quiere una demo, menciona cuántas pantallas necesita, habla de su negocio, dice que quiere probarlo, pide contacto, etc.), debes incluir AL FINAL de tu mensaje la etiqueta especial:
[SHOW_LEAD_FORM]

Esta etiqueta hará que el sistema muestre un formulario de contacto inline. Solo úsala UNA VEZ en toda la conversación y solo cuando haya interés genuino. No la uses si el usuario solo hace preguntas generales sin intención de compra.

Antes de mostrar la etiqueta, escribe un mensaje natural invitando al usuario a dejar sus datos, por ejemplo:
"¡Perfecto! Para conectarte con un asesor que te ayude con tu caso, déjanos tus datos y te contactamos enseguida. 👇"

Después de que el usuario envíe el formulario, el sistema te lo confirmará. Entonces agradece y dile que un asesor se pondrá en contacto pronto.`;

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
