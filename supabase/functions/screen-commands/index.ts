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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/screen-commands", "").replace(/^\//, "");

    const serviceClient = createClient(supabaseUrl, serviceKey);

    // POST /screen-commands/sync — Sync screen data from latest device checkin
    if (req.method === "POST" && path === "sync") {
      const { screen_id } = await req.json();
      if (!screen_id) {
        return new Response(JSON.stringify({ error: "Missing screen_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify user has access via RLS (query as user)
      const { data: screen, error: screenErr } = await userClient
        .from("screens")
        .select("id, name, status, last_seen_at, location_id")
        .eq("id", screen_id)
        .maybeSingle();

      if (screenErr || !screen) {
        return new Response(JSON.stringify({ error: "Screen not found or access denied" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get latest device info
      const { data: device } = await serviceClient
        .from("devices")
        .select("id, status, last_seen_at, app_version, device_code")
        .eq("screen_id", screen_id)
        .maybeSingle();

      // Get current assigned playlist
      const { data: schedule } = await userClient
        .from("schedules")
        .select("id, playlist_id, playlists(id, name)")
        .eq("screen_id", screen_id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      // Update last_sync_at on the screen
      const now = new Date().toISOString();
      await serviceClient
        .from("screens")
        .update({ last_sync_at: now, updated_at: now })
        .eq("id", screen_id);

      // Determine online status from device
      const isOnline = device?.last_seen_at
        ? Date.now() - new Date(device.last_seen_at).getTime() < 2 * 60 * 1000
        : false;

      // Update screen status based on device
      if (device) {
        await serviceClient
          .from("screens")
          .update({ status: isOnline ? "online" : "offline" })
          .eq("id", screen_id);
      }

      return new Response(
        JSON.stringify({
          screen_id,
          status: isOnline ? "online" : "offline",
          last_seen_at: device?.last_seen_at || null,
          last_sync_at: now,
          device: device
            ? {
                id: device.id,
                status: device.status,
                app_version: device.app_version,
                device_code: device.device_code,
              }
            : null,
          current_playlist: schedule?.playlists
            ? { id: (schedule.playlists as any).id, name: (schedule.playlists as any).name }
            : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /screen-commands/send — Send a command to a screen via the commands table
    if (req.method === "POST" && path === "send") {
      const { screen_id, command, payload } = await req.json();
      if (!screen_id || !command) {
        return new Response(JSON.stringify({ error: "Missing screen_id or command" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert command (RLS will verify access)
      const { data: cmd, error: cmdErr } = await userClient
        .from("screen_commands")
        .insert({
          screen_id,
          command,
          payload: payload || {},
          status: "pending",
        })
        .select("id, command, status, created_at")
        .single();

      if (cmdErr) {
        return new Response(JSON.stringify({ error: cmdErr.message }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(cmd), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
