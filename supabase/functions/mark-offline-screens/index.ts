// Cron job (cada minuto): marca como 'offline' las pantallas Y los dispositivos
// cuyo last_seen_at es más viejo que OFFLINE_THRESHOLD_SECONDS.
// Las dos tablas se barren en la MISMA pasada para que no exista ventana de
// incoherencia entre la vista de Pantallas y la de Dispositivos.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  OFFLINE_THRESHOLD_SECONDS,
  neverSeenCutoffISO,
  offlineCutoffISO,
} from "../_shared/offlineThreshold.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = offlineCutoffISO();
    const createdCutoff = neverSeenCutoffISO();

    const { data, error } = await supabase
      .from("screens")
      .update({ status: "offline" })
      .lt("last_seen_at", cutoff)
      .neq("status", "offline")
      .select("id");

    if (error) {
      console.error("[mark-offline] screens update failed", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pantallas que nunca reportaron (last_seen_at null) y ya pasaron la gracia.
    await supabase
      .from("screens")
      .update({ status: "offline" })
      .is("last_seen_at", null)
      .lt("created_at", createdCutoff)
      .neq("status", "offline");

    // Misma pasada, misma ventana: dispositivos vinculados sin latido reciente.
    const { data: staleDevices, error: devicesError } = await supabase
      .from("devices")
      .update({ status: "offline", updated_at: new Date().toISOString() })
      .lt("last_seen_at", cutoff)
      .neq("status", "offline")
      .not("paired_at", "is", null)
      .select("id");

    if (devicesError) {
      console.error("[mark-offline] devices update failed", devicesError);
    }

    const { data: neverSeenDevices } = await supabase
      .from("devices")
      .update({ status: "offline", updated_at: new Date().toISOString() })
      .is("last_seen_at", null)
      .lt("paired_at", createdCutoff)
      .neq("status", "offline")
      .select("id");

    return new Response(
      JSON.stringify({
        screens_marked_offline: data?.length ?? 0,
        devices_marked_offline:
          (staleDevices?.length ?? 0) + (neverSeenDevices?.length ?? 0),
        cutoff,
        threshold_seconds: OFFLINE_THRESHOLD_SECONDS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[mark-offline] unexpected error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
