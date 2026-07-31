import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function bogotaParts(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const wd = parts.find(p => p.type === "weekday")?.value ?? "Mon";
  const h = Number(parts.find(p => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find(p => p.type === "minute")?.value ?? "0");
  return { wd, h, m };
}

function inOfficeHours() {
  const { wd, h, m } = bogotaParts();
  const min = h * 60 + m;
  return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(wd) && min >= 480 && min <= 1080;
}

function nextOfficeDate() {
  let d = new Date(Date.now() + 60 * 60 * 1000);
  for (let i = 0; i < 72; i++) {
    const { wd, h } = bogotaParts(d);
    if (["Mon", "Tue", "Wed", "Thu", "Fri"].includes(wd) && h >= 8) return d;
    d = new Date(d.getTime() + 60 * 60 * 1000);
  }
  return new Date(Date.now() + 60 * 60 * 1000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, email, phone, whatsapp, company, screens, goal, budget, inquiry, preferred_time, preferred_contact, events = [] } = body;

    // --- Validación y saneamiento de entrada (endpoint público) ---
    const clean = (v: unknown, max: number): string | null => {
      if (typeof v !== "string") return null;
      const s = v.replace(/[\u0000-\u001F\u007F]/g, "").trim();
      return s ? s.slice(0, max) : null;
    };

    const safeName = clean(name, 120);
    const safeEmail = clean(email, 160);
    const safePhone = clean(phone, 30);
    const safeWhatsapp = clean(whatsapp, 30);

    if (!safeName || safeName.length < 2) {
      return Response.json({ ok: false, error: "Nombre inválido" }, { status: 400, headers: corsHeaders });
    }
    if (safeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(safeEmail)) {
      return Response.json({ ok: false, error: "Correo inválido" }, { status: 400, headers: corsHeaders });
    }
    if (!safeEmail && !safePhone && !safeWhatsapp) {
      return Response.json({ ok: false, error: "Necesitamos un correo o teléfono de contacto" }, { status: 400, headers: corsHeaders });
    }
    for (const p of [safePhone, safeWhatsapp]) {
      if (p && !/^[+()\-.\s0-9]{7,30}$/.test(p)) {
        return Response.json({ ok: false, error: "Teléfono inválido" }, { status: 400, headers: corsHeaders });
      }
    }

    const safeScreens = Math.min(1000, Math.max(1, Math.floor(Number(screens) || 1)));

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        whatsapp: safeWhatsapp,
        company: clean(company, 160),
        screens: safeScreens,
        goal: clean(goal, 200),
        budget: clean(budget, 100),
        inquiry: clean(inquiry, 2000),
        preferred_time: clean(preferred_time, 100),
        preferred_contact: clean(preferred_contact, 40),
      })
      .select("id")
      .single();

    if (error) {
      console.error("submit-lead insert error:", error.message);
      return Response.json({ ok: false, error: "No pudimos registrar tu solicitud" }, { status: 400, headers: corsHeaders });
    }


    if (Array.isArray(events) && events.length) {
      const safeEvents = events
        .slice(0, 50)
        .map((e: any) => ({
          lead_id: lead.id,
          step: clean(e?.step, 80),
          answer: clean(e?.answer, 500),
        }))
        .filter((e) => e.step);
      if (safeEvents.length) {
        await supabase.from("lead_events").insert(safeEvents);
      }
    }

    const send_after = inOfficeHours() ? new Date().toISOString() : nextOfficeDate().toISOString();

    await supabase.from("advisor_notifications").insert({
      lead_id: lead.id,
      send_after,
      payload: {
        lead_id: lead.id,
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        whatsapp: safeWhatsapp,
        company: clean(company, 160),
        screens: safeScreens,
        goal: clean(goal, 200),
        budget: clean(budget, 100),
        inquiry: clean(inquiry, 2000),
        preferred_time: clean(preferred_time, 100),
        mensaje: "Nuevo lead de Visualia para atención inmediata.",
      },
    });

    return Response.json({ ok: true, lead_id: lead.id }, { headers: corsHeaders });
  } catch (e) {
    console.error("submit-lead error:", e);
    return Response.json(
      { ok: false, error: "Error procesando la solicitud" },
      { status: 500, headers: corsHeaders }
    );

  }
});
