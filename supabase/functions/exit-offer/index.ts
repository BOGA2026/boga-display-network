// Oferta de salida — puente público.
// Las funciones de base de datos ya no son ejecutables por visitantes anónimos:
// todo pasa por acá, con service role y validación estricta de entrada.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const VISITOR_RE = /^[A-Za-z0-9._-]{8,64}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = String(body.action ?? "");
  const visitorId = String(body.visitor_id ?? "");

  if (!["claim", "get", "mark"].includes(action)) {
    return json({ error: "Acción inválida" }, 400);
  }
  if (!VISITOR_RE.test(visitorId)) {
    return json({ error: "Visitante inválido" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    if (action === "mark") {
      const status = String(body.status ?? "");
      if (status !== "accepted" && status !== "dismissed") {
        return json({ error: "Estado inválido" }, 400);
      }
      const { data, error } = await admin.rpc("exit_offer_mark", {
        p_visitor_id: visitorId,
        p_status: status,
      });
      if (error) throw error;
      return json({ offer: data ?? null });
    }

    const fn = action === "claim" ? "exit_offer_claim" : "exit_offer_get";
    const { data, error } = await admin.rpc(fn, { p_visitor_id: visitorId });
    if (error) throw error;
    return json({ offer: data ?? null });
  } catch (err) {
    console.error("exit-offer error:", err);
    return json({ error: "No se pudo procesar la oferta" }, 500);
  }
});
