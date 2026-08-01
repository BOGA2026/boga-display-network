// Periodic sweeper: flips devices without a heartbeat for longer than
// OFFLINE_THRESHOLD_SECONDS to `offline`. Same window as mark-offline-screens.
// Intended to run on a schedule (pg_cron / scheduled trigger) or invoked
// manually. Safe to call frequently — the SQL is idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OFFLINE_THRESHOLD_SECONDS } from "../_shared/offlineThreshold.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const url = new URL(req.url);
    const threshold = Math.max(30, Math.min(600, Number(url.searchParams.get("threshold") ?? OFFLINE_THRESHOLD_SECONDS)));
    const { data, error } = await supabase.rpc("sweep_offline_devices", { _threshold_seconds: threshold });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, marked_offline: data ?? 0, threshold }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sweep-devices error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
