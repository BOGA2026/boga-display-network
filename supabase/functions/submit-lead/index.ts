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

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        name, email, phone, whatsapp, company,
        screens: Number(screens || 1),
        goal, budget, inquiry, preferred_time,
        preferred_contact,
      })
      .select("*")
      .single();

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400, headers: corsHeaders });
    }

    if (Array.isArray(events) && events.length) {
      await supabase.from("lead_events").insert(
        events.map((e: any) => ({ lead_id: lead.id, step: e.step, answer: e.answer }))
      );
    }

    const send_after = inOfficeHours() ? new Date().toISOString() : nextOfficeDate().toISOString();

    await supabase.from("advisor_notifications").insert({
      lead_id: lead.id,
      send_after,
      payload: {
        lead_id: lead.id,
        name, email, phone, whatsapp, company, screens, goal, budget,
        inquiry, preferred_time,
        mensaje: "Nuevo lead de Visualia para atención inmediata.",
      },
    });

    return Response.json({ ok: true, lead_id: lead.id }, { headers: corsHeaders });
  } catch (e) {
    console.error("submit-lead error:", e);
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error desconocido" },
      { status: 500, headers: corsHeaders }
    );
  }
});
