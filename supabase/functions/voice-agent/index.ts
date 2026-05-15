// Cerebro del agente de voz Visualia.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_locations_screens",
      description: "Lista todas las sedes y pantallas del negocio. Úsala para saber qué pantallas existen.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "query_screen_status",
      description: "Consulta el estado actual de una pantalla (online/offline, última vez vista).",
      parameters: {
        type: "object",
        properties: { screen_id: { type: "string" } },
        required: ["screen_id"], additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reload_screens",
      description: "Manda RELOAD a una o varias pantallas para que descarguen contenido nuevo.",
      parameters: {
        type: "object",
        properties: { screen_ids: { type: "array", items: { type: "string" } } },
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
        properties: { search: { type: "string" } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_content_item_price",
      description: "Cambia el precio de un item. REQUIERE confirmación visual del usuario.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string" },
          item_name: { type: "string" },
          new_price: { type: "number", description: "Precio en pesos colombianos" },
        },
        required: ["item_id", "item_name", "new_price"], additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_content_item_active",
      description: "Activa o desactiva un item del menú. REQUIERE confirmación.",
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
  {
    type: "function",
    function: {
      name: "list_playlists",
      description: "Lista las playlists/contenidos disponibles para programar en pantalla.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "cambiar_horario",
      description: "Crea un bloque de programación (ej: 'happy hour de 5 a 7 lunes a viernes'). REQUIERE confirmación. Antes llamá list_playlists y list_locations_screens si no tenés los IDs.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre del bloque, ej: 'Happy Hour'" },
          screen_id: { type: "string" },
          playlist_id: { type: "string" },
          start_time: { type: "string", description: "HH:MM 24h, ej: '17:00'" },
          end_time: { type: "string", description: "HH:MM 24h, ej: '19:00'" },
          days_of_week: {
            type: "array", items: { type: "integer", minimum: 0, maximum: 6 },
            description: "0=Dom, 1=Lun ... 6=Sáb",
          },
        },
        required: ["name", "screen_id", "playlist_id", "start_time", "end_time", "days_of_week"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pausar_contenido",
      description: "Pausa la pantalla por X minutos (manda comando PAUSE). REQUIERE confirmación.",
      parameters: {
        type: "object",
        properties: {
          screen_ids: { type: "array", items: { type: "string" } },
          duration_minutes: { type: "number", description: "Duración de la pausa en minutos" },
        },
        required: ["screen_ids", "duration_minutes"], additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "restaurar_ultima_accion",
      description: "Deshace la última acción reversible (cambio de precio, toggle, pausa). REQUIERE confirmación.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_playlist",
      description: "Crea una nueva playlist (lista de contenidos) vacía en el negocio. REQUIERE confirmación.",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Nombre de la playlist" } },
        required: ["name"], additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_contenido",
      description: "Crea una plantilla YA POBLADA con el contenido que el usuario te dictó. REQUIERE confirmación. NO la llames hasta haber preguntado y recibido: (1) tipo de pieza (menu/promo/producto), (2) dimensiones (aspect_ratio), (3) los datos concretos según el tipo. Nunca inventes items, precios ni textos: si te falta algo, preguntá.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre interno de la plantilla, ej: 'Menú Hamburguesas Sábado'" },
          kind: { type: "string", enum: ["menu", "promo", "product"], description: "Qué clase de pieza: 'menu' carta de varios items, 'promo' banner con mensaje y CTA, 'product' tarjeta de un solo producto." },
          aspect_ratio: { type: "string", enum: ["16:9", "9:16", "1:1"], description: "Dimensiones: 16:9 horizontal (TV), 9:16 vertical (tótem), 1:1 cuadrado." },
          duration_seconds: { type: "number", description: "Duración en pantalla (segundos). Default: 10" },
          background_color: { type: "string", description: "Color de fondo del lienzo en HEX, ej: '#0f172a'. Default: '#FFFFFF'." },
          accent_color: { type: "string", description: "Color de acento en HEX para títulos/precios. Default: '#7C3AED'." },
          menu: {
            type: "object",
            description: "Obligatorio si kind='menu'. Contenido de la carta.",
            properties: {
              header: { type: "string", description: "Título de la carta, ej: 'MENÚ DEL DÍA'" },
              items: {
                type: "array",
                description: "Lista de items recolectados al usuario.",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "string", description: "Precio formateado, ej: '$24.900'" },
                  },
                  required: ["name", "price"], additionalProperties: false,
                },
              },
            },
            required: ["header", "items"], additionalProperties: false,
          },
          promo: {
            type: "object",
            description: "Obligatorio si kind='promo'.",
            properties: {
              title: { type: "string", description: "Ej: 'PROMO DEL DÍA'" },
              message: { type: "string", description: "Mensaje principal" },
              cta: { type: "string", description: "Llamado a acción, ej: '¡Solo hoy!'" },
            },
            required: ["title", "message", "cta"], additionalProperties: false,
          },
          product: {
            type: "object",
            description: "Obligatorio si kind='product'.",
            properties: {
              title: { type: "string" },
              subtitle: { type: "string" },
              price: { type: "string", description: "Ej: '$24.900'" },
              image_url: { type: "string", description: "URL pública opcional de la foto del producto" },
            },
            required: ["title", "price"], additionalProperties: false,
          },
        },
        required: ["name", "kind", "aspect_ratio"], additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_item",
      description: "Crea un nuevo item (producto/plato/promo) dentro de un contenido existente. Llamá list_content_items antes para ubicar el content_id correcto. REQUIERE confirmación.",
      parameters: {
        type: "object",
        properties: {
          content_id: { type: "string" },
          name: { type: "string" },
          price: { type: "number" },
          description: { type: "string" },
        },
        required: ["content_id", "name"], additionalProperties: false,
      },
    },
  },
];

const SYSTEM_PROMPT = `Eres el agente de voz de Visualia, asistente del dueño de un negocio en Colombia que maneja pantallas digitales (menús, promos, contenido).

PERSONALIDAD: Vendedor digital colombiano. Cálido, directo, decidido. Tuteás natural ("vos"/"tú" según el dueño). Cero jerga técnica.

REGLAS CRÍTICAS:
- Respondé SIEMPRE en español colombiano. Máximo 2 frases. El dueño está apurado.
- Tu respuesta se va a leer en voz alta — escribí natural para escuchar, sin emojis ni markdown.
- NUNCA prometas una acción si no tenés una herramienta para hacerla. Si no podés, decí: "Eso todavía no lo puedo hacer desde acá".
- Usá las herramientas. NO inventes datos (pantallas, precios, items, IDs).
- Si necesitás info, llamá list_locations_screens / list_content_items / list_playlists PRIMERO.
- Acciones destructivas o de creación (precio, desactivar, programar, pausar, restaurar, crear playlist/item) → llamá la herramienta; el cliente pide confirmación antes.
- Ambigüedad → preguntá corto: "¿Cuál menú? Tenés Ejecutivo y Desayuno."
- Precios COP: "25 mil"=25000, "veinticinco"=25000.
- Días: "lunes a viernes"=[1,2,3,4,5], "fin de semana"=[0,6].
- Crear plantilla/contenido: NUNCA llames crear_contenido de una. Hacé una mini entrevista (una pregunta a la vez, máx 2 frases) para recolectar todo lo necesario:
  1) "¿Qué querés armar: una carta/menú, una promo o una tarjeta de producto?"
  2) "¿La querés horizontal para TV (16:9), vertical para tótem (9:16) o cuadrada (1:1)?"
  3) Si es MENÚ: pedí el título de la carta y luego los items uno por uno con su precio ("Decime el primer plato y su precio" / "¿Otro? Si ya está, decime listo"). NO inventes platos ni precios.
  4) Si es PROMO: pedí título, mensaje y llamado a acción.
  5) Si es PRODUCTO: pedí nombre, descripción corta, precio y si tiene foto.
  6) Opcional: "¿Algún color de acento o lo dejo morado Visualia?"
  Cuando tengas todo, llamá crear_contenido con kind, aspect_ratio y el bloque correspondiente (menu/promo/product) ya completo. El cliente pide confirmación visual antes de guardar.

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

    // Transformar mensajes user con `images` al formato multimodal OpenAI-compat.
    const normalized = (messages as any[]).map((m) => {
      if (m.role === "user" && Array.isArray(m.images) && m.images.length) {
        const parts: any[] = [{ type: "text", text: m.content || "" }];
        for (const url of m.images) parts.push({ type: "image_url", image_url: { url } });
        return { role: "user", content: parts };
      }
      // Limpiar campos no estándar
      const { images: _i, ...rest } = m;
      return rest;
    });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemContent }, ...normalized],
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
