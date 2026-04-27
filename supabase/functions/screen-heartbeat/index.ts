// Heartbeat público para que el APK reporte estado cada 60s.
// Sin JWT — el APK no autentica, solo envía su deviceCode/screenId.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface HeartbeatBody {
  deviceCode?: string; // código de pareo (ej: ACME01)
  screenId?: string;   // alternativa: UUID directo
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
  ipAddress?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: HeartbeatBody = await req.json();
    const { deviceCode, screenId, appVersion, deviceModel, osVersion, ipAddress } = body;

    if (!deviceCode && !screenId) {
      return new Response(
        JSON.stringify({ error: "deviceCode or screenId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolver screen target
    let targetScreenId = screenId;
    if (!targetScreenId && deviceCode) {
      // El "deviceCode" ingresado en el APK es el nombre de la pantalla (ABC123).
      // Buscamos por nombre exacto (case-insensitive).
      const { data: screen } = await supabase
        .from("screens")
        .select("id")
        .ilike("name", deviceCode.trim())
        .maybeSingle();
      targetScreenId = screen?.id;
    }

    if (!targetScreenId) {
      return new Response(
        JSON.stringify({ error: "Screen not found", deviceCode }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updates: Record<string, unknown> = {
      last_seen_at: new Date().toISOString(),
      status: "online",
    };
    if (appVersion) updates.app_version = appVersion;
    if (deviceModel) updates.device_model = deviceModel;
    if (osVersion) updates.os_version = osVersion;
    if (ipAddress) updates.ip_address = ipAddress;

    const { error } = await supabase
      .from("screens")
      .update(updates)
      .eq("id", targetScreenId);

    if (error) {
      console.error("heartbeat update error", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, screenId: targetScreenId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("heartbeat fatal", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
