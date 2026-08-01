// Cron job: marks screens as 'offline' when their last_seen_at is older than
// OFFLINE_THRESHOLD_SECONDS (shared with sweep-devices so both views agree).
// Scheduled via pg_cron (see migration). No JWT required — invoked from inside Supabase.
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

    const { data, error } = await supabase
      .from("screens")
      .update({ status: "offline" })
      .lt("last_seen_at", cutoff)
      .neq("status", "offline")
      .select("id");

    if (error) {
      console.error("[mark-offline] update failed", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also mark screens that have NEVER reported in (null last_seen_at and
    // created long enough ago that pairing should have happened).
    const createdCutoff = neverSeenCutoffISO();
    await supabase
      .from("screens")
      .update({ status: "offline" })
      .is("last_seen_at", null)
      .lt("created_at", createdCutoff)
      .neq("status", "offline");

    return new Response(
      JSON.stringify({
        marked_offline: data?.length ?? 0,
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
