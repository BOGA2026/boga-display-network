// Cerebro del agente de voz Visualia.
// Recibe historial + contexto del negocio, llama a Lovable AI con tool calling,
// y devuelve o un mensaje de texto o una lista de tool_calls que el cliente ejecuta.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_locations_screens",
      description: "Lista todas las sedes y pantallas del negocio. Úsala cuando necesites saber qué pantallas existen antes de actuar.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "query_screen_status",
      description: "Consulta el estado actual de una pantalla (online/offline, qué playlist tiene asignada).",
      parameters: {
        type: "object",
        properties: { screen_id: { type: "string", description: "UUID de la pantalla" } },
        required: ["screen_id"], additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reload_screens",
      description: "Manda comando de recarga (RELOAD) a una o varias pantallas para que descarguen contenido nuevo.",
      parameters: {
        type: "object",
        properties: {
          screen_ids: { type: "array", items: { type: "string" }, description: "UUIDs de las pantallas a recargar" },
        },
        required: ["screen_ids"], additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_content_items",
      description: "Lista los items (productos/platos/promos) del negocio con sus precios. Úsala antes de cambiar precios.",
      parameters: {
        type: "object",
        properties: { search: { type: "string", description: "Texto opcional para filtrar por nombre" } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_content_item_price",
      description: "Cambia el precio de un item de contenido (plato, producto). REQUIERE confirmación visual del usuario antes de ejecutar.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "UUID del item" },
          item_name: { type: "string", description: "Nombre del item para mostrar al usuario" },
          new_price: { type: "number", description: "Nuevo precio en pesos colombianos" },
        },
        required: ["item_id", "item_name", "new_price"], additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_content_item_active",
      description: "Activa o desactiva un item (ej: 'quitar la hamburguesa BBQ del menú'). REQUIERE confirmación.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string" },
          item_name: { type: "string" },
          is_active: { type: "boolean" },
        },
        required: ["item_id", "item_name", "is_active"], additionalProperties: false,
      },
    },
  },
];

const SYSTEM_PROMPT = `Eres el agente de voz de Visualia, asistente del dueño de un negocio en Colombia que maneja pantallas digitales (menús, promos, contenido).

REGLAS CRÍTICAS:
- Habla SIEMPRE en español colombiano, casual y directo. Ej: "Listo", "Dale", "¿Confirmás?".
- Sé MUY breve. Máximo 2 frases. El dueño está ocupado.
- Usa las herramientas disponibles para responder. NO inventes datos.
- Si necesitas info (qué pantallas hay, qué items existen), llama a list_locations_screens o list_content_items PRIMERO.
- Para acciones destructivas (cambiar precio, desactivar item) llama a la herramienta correspondiente — el cliente pedirá confirmación antes de ejecutar.
- Si el usuario es ambiguo ("cambia el precio del menú"), pide aclaración corta: "¿Cuál menú? Tenés Ejecutivo y Desayuno."
- Para precios en pesos colombianos: "25 mil" = 25000, "veinticinco" = 25000.

Negocio actual: {{BUSINESS_CONTEXT}}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const { messages, business_context } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages debe ser un array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemContent = SYSTEM_PROMPT.replace(
      "{{BUSINESS_CONTEXT}}",
      business_context || "(sin contexto)",
    );

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemContent }, ...messages],
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes, esperá un momento." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "Sin créditos de Lovable AI. Recargá en Settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const choice = data.choices?.[0]?.message;
    return new Response(JSON.stringify({
      content: choice?.content || "",
      tool_calls: choice?.tool_calls || [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("voice-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
