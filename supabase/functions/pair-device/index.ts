import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const url = new URL(req.url);
    const path = url.pathname.replace("/pair-device", "").replace(/^\//, "");

    // POST /pair-device/register — device self-registers with a code
    if (req.method === "POST" && path === "register") {
      const { device_code, app_version } = await req.json();
      if (!device_code || typeof device_code !== "string" || device_code.length < 4) {
        return new Response(JSON.stringify({ error: "Invalid device_code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if code already exists
      const { data: existing } = await supabase
        .from("devices")
        .select("id, status")
        .eq("device_code", device_code.toUpperCase())
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ id: existing.id, status: existing.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // We don't create yet — the device just shows its code. 
      // The CMS admin will create the record when pairing.
      return new Response(JSON.stringify({ status: "awaiting_pairing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /pair-device/checkin — device heartbeat
    if (req.method === "POST" && path === "checkin") {
      const { device_code, app_version } = await req.json();
      if (!device_code) {
        return new Response(JSON.stringify({ error: "Missing device_code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: device, error } = await supabase
        .from("devices")
        .update({ last_seen_at: new Date().toISOString(), app_version: app_version || null })
        .eq("device_code", device_code.toUpperCase())
        .select("id, status, screen_id")
        .maybeSingle();

      if (error || !device) {
        return new Response(JSON.stringify({ error: "Device not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Also update screen status
      if (device.screen_id) {
        await supabase
          .from("screens")
          .update({ last_seen_at: new Date().toISOString(), status: "online" })
          .eq("id", device.screen_id);
      }

      // Fetch assigned playlist config if paired
      let config = null;
      if (device.status === "paired" && device.screen_id) {
        const { data: schedule } = await supabase
          .from("schedules")
          .select("id, playlist_id, playlists(id, name, playlist_items(id, sort_order, content(id, name, file_url, type, duration_seconds)))")
          .eq("screen_id", device.screen_id)
          .eq("is_active", true)
          .order("start_time", { ascending: false })
          .limit(1)
          .maybeSingle();

        config = schedule;
      }

      return new Response(JSON.stringify({ status: device.status, config }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
