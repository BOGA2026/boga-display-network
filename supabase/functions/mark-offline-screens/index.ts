// Cron job: marks screens as 'offline' when their last_seen_at is older than 3 minutes.
// Scheduled via pg_cron (see migration). No JWT required — invoked from inside Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();

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

    // Also mark screens that have NEVER reported in (last_seen_at is null and created_at > 5 min ago)
    const createdCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await supabase
      .from("screens")
      .update({ status: "offline" })
      .is("last_seen_at", null)
      .lt("created_at", createdCutoff)
      .neq("status", "offline");

    return new Response(
      JSON.stringify({ marked_offline: data?.length ?? 0, cutoff }),
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
