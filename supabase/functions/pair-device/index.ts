import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory sliding-window rate limiter (per instance, per IP+path).
// Not a substitute for a WAF but blocks trivial abuse from a single origin.
const RL_WINDOW_MS = 60_000;
const RL_MAX = { register: 10, checkin: 120, status: 60, claim: 20 } as const;
const rlBuckets = new Map<string, number[]>();

// Brute-force detector: >N failed claim attempts / 10 min from same IP → block.
const BF_WINDOW_MS = 10 * 60_000;
const BF_MAX_FAILURES = 8;

function rateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const arr = (rlBuckets.get(key) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= max) {
    rlBuckets.set(key, arr);
    return true;
  }
  arr.push(now);
  rlBuckets.set(key, arr);
  return false;
}

function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Log a pairing attempt (audit). Never throws.
async function logAttempt(
  supabase: any,
  opts: { ip: string; code: string | null; businessId: string | null; success: boolean; reason: string; ua: string | null }
) {
  try {
    await supabase.from("pairing_attempts").insert({
      ip: opts.ip === "unknown" ? null : opts.ip,
      device_code_attempted: opts.code,
      business_id_target: opts.businessId,
      success: opts.success,
      reason: opts.reason,
      user_agent: opts.ua,
    });
  } catch (e) {
    console.warn("pairing_attempts insert failed", e);
  }
}

async function isBruteForced(supabase: any, ip: string): Promise<boolean> {
  if (ip === "unknown") return false;
  const since = new Date(Date.now() - BF_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("pairing_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("success", false)
    .gte("created_at", since);
  return (count ?? 0) >= BF_MAX_FAILURES;
}


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

    const ip = clientIp(req);

    // POST /pair-device/register — device self-registers with a code
    if (req.method === "POST" && path === "register") {
      if (rateLimited(`register:${ip}`, RL_MAX.register)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
      if (rateLimited(`checkin:${ip}`, RL_MAX.checkin)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await req.json();
      const { device_code, app_version, device_model, os_version, user_agent, gps } = body;
      if (!device_code) {
        return new Response(JSON.stringify({ error: "Missing device_code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const nowIso = new Date().toISOString();
      const { data: device, error } = await supabase
        .from("devices")
        .update({ last_seen_at: nowIso, app_version: app_version || null })
        .eq("device_code", device_code.toUpperCase())
        .select("id, status, screen_id")
        .maybeSingle();

      if (error || !device) {
        return new Response(JSON.stringify({ error: "Device not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Auto-pair: if device was pending and has a screen assigned, mark as paired
      if (device.status === "pending" && device.screen_id) {
        const { data: paired } = await supabase
          .from("devices")
          .update({ status: "paired", paired_at: nowIso })
          .eq("id", device.id)
          .select("id, status, screen_id")
          .maybeSingle();
        if (paired) {
          device.status = paired.status;
        }
      }

      // Also update screen status + technical info
      if (device.screen_id) {
        const screenUpdate: Record<string, unknown> = {
          last_seen_at: nowIso,
          status: "online",
        };
        if (app_version) screenUpdate.app_version = app_version;
        if (device_model) screenUpdate.device_model = device_model;
        if (os_version) screenUpdate.os_version = os_version;

        // GPS from the device — highest priority location source
        if (
          gps &&
          typeof gps.lat === "number" &&
          typeof gps.lng === "number" &&
          Math.abs(gps.lat) <= 90 &&
          Math.abs(gps.lng) <= 180
        ) {
          screenUpdate.gps_lat = gps.lat;
          screenUpdate.gps_lng = gps.lng;
          screenUpdate.gps_accuracy = typeof gps.accuracy === "number" ? gps.accuracy : null;
          screenUpdate.gps_updated_at = nowIso;
        }

        // Capture client IP for approximate geo when no GPS
        const ip =
          req.headers.get("cf-connecting-ip") ||
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          null;
        if (ip) screenUpdate.ip_address = ip;

        // Lookup approximate geo when the IP changed (or never resolved before)
        if (ip) {
          const { data: prev } = await supabase
            .from("screens")
            .select("ip_geo_for")
            .eq("id", device.screen_id)
            .maybeSingle();
          if (!prev?.ip_geo_for || prev.ip_geo_for !== ip) {
            try {
              const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
                headers: { "User-Agent": "visualia-checkin/1.0" },
              });
              if (geoRes.ok) {
                const geo = await geoRes.json();
                if (typeof geo.latitude === "number" && typeof geo.longitude === "number") {
                  screenUpdate.ip_lat = geo.latitude;
                  screenUpdate.ip_lng = geo.longitude;
                  screenUpdate.ip_city = geo.city ?? null;
                  screenUpdate.ip_region = geo.region ?? null;
                  screenUpdate.ip_country = geo.country_name ?? geo.country ?? null;
                  screenUpdate.ip_geo_updated_at = nowIso;
                  screenUpdate.ip_geo_for = ip;
                }
              }
            } catch (geoErr) {
              console.warn("ipapi lookup failed:", geoErr);
            }
          }
        }

        await supabase.from("screens").update(screenUpdate).eq("id", device.screen_id);
      }


      // Fetch assigned playlist config + screen settings if paired
      let config = null;
      let rotation = 0;
      let pending_command: { id: string; command: string; payload: any } | null = null;
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

        const { data: screenRow } = await supabase
          .from("screens")
          .select("rotation")
          .eq("id", device.screen_id)
          .maybeSingle();
        rotation = (screenRow as any)?.rotation ?? 0;

        // Pull the latest pending command for this screen, mark it as executed
        const { data: cmd } = await supabase
          .from("screen_commands")
          .select("id, command, payload")
          .eq("screen_id", device.screen_id)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (cmd) {
          pending_command = cmd as any;
          await supabase
            .from("screen_commands")
            .update({ status: "executed", executed_at: new Date().toISOString() })
            .eq("id", cmd.id);
        }
      }

      return new Response(JSON.stringify({
        status: device.status,
        config,
        rotation,
        screen_id: device.screen_id ?? null,
        pending_command,
      }), {
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
