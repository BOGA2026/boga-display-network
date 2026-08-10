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

    const ua = req.headers.get("user-agent");

    // POST /pair-device/register — TV publishes its 6-digit code.
    // Creates a pending device row with a 10-minute expiration.
    if (req.method === "POST" && path === "register") {
      if (rateLimited(`register:${ip}`, RL_MAX.register)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await req.json().catch(() => ({}));
      const { device_code, app_version, resolution, network_type } = body ?? {};
      // TV codes are 6 numeric digits; panel codes remain alphanumeric.
      if (!device_code || typeof device_code !== "string" || !/^[0-9]{6}$/.test(device_code)) {
        return new Response(JSON.stringify({ error: "Invalid device_code (expected 6 digits)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const nowMs = Date.now();
      const expiresIso = new Date(nowMs + 10 * 60_000).toISOString();

      const { data: existing } = await supabase
        .from("devices")
        .select("id, status, code_expires_at, business_id")
        .eq("device_code", device_code)
        .maybeSingle();

      if (existing) {
        // Already claimed → tell TV to regenerate
        if (existing.business_id) {
          return new Response(JSON.stringify({ error: "code_in_use" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Refresh expiration for idle pending row
        await supabase
          .from("devices")
          .update({
            code_expires_at: expiresIso,
            app_version: app_version ?? null,
            resolution: resolution ?? null,
            network_type: network_type ?? null,
            ip: ip === "unknown" ? null : ip,
          })
          .eq("id", existing.id);
        return new Response(JSON.stringify({ id: existing.id, status: "awaiting_pairing", expires_at: expiresIso }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("devices")
        .insert({
          device_code,
          status: "pending",
          code_source: "tv",
          code_expires_at: expiresIso,
          app_version: app_version ?? null,
          resolution: resolution ?? null,
          network_type: network_type ?? null,
          ip: ip === "unknown" ? null : ip,
        })
        .select("id")
        .single();

      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ id: inserted.id, status: "awaiting_pairing", expires_at: expiresIso }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /pair-device/status?code=XXXXXX — TV polls to see if it's been claimed.
    // Returns the heartbeat_token exactly once, then wipes it from the row.
    if (req.method === "GET" && path === "status") {
      if (rateLimited(`status:${ip}`, RL_MAX.status)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const code = url.searchParams.get("code");
      if (!code || !/^[0-9]{6}$/.test(code)) {
        return new Response(JSON.stringify({ error: "Invalid code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: device } = await supabase
        .from("devices")
        .select("id, status, business_id, screen_id, heartbeat_token, code_expires_at, deleted_at")
        .eq("device_code", code)
        .maybeSingle();
      if (!device) {
        return new Response(JSON.stringify({ error: "not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // La pantalla fue eliminada desde el panel: el equipo debe desvincularse.
      if (device.deleted_at) {
        return new Response(JSON.stringify({ status: "unpaired", reason: "screen_deleted" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (device.code_expires_at && new Date(device.code_expires_at).getTime() < Date.now() && !device.business_id) {
        return new Response(JSON.stringify({ status: "expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!device.business_id) {
        return new Response(JSON.stringify({ status: "awaiting_pairing" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Claimed — release token exactly once, then null it in the row and clear the code.
      const token = device.heartbeat_token;
      if (token) {
        await supabase
          .from("devices")
          .update({ heartbeat_token: null, device_code: null })
          .eq("id", device.id);
      }
      return new Response(JSON.stringify({
        status: "paired",
        device_id: device.id,
        business_id: device.business_id,
        screen_id: device.screen_id,
        heartbeat_token: token,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /pair-device/lookup — el panel valida un código ANTES de vincular.
    // No reclama nada: solo confirma que el código existe y devuelve qué equipo es
    // (modelo, resolución, red) para que el usuario sepa a qué televisor le está
    // poniendo nombre. Requiere JWT y rol admin/manager, igual que /claim.
    if (req.method === "POST" && path === "lookup") {
      if (rateLimited(`claim:${ip}`, RL_MAX.claim)) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (await isBruteForced(supabase, ip)) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
      if (!jwt) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: userRes, error: userErr } = await supabase.auth.getUser(jwt);
      if (userErr || !userRes?.user) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json().catch(() => ({}));
      const rawCode = typeof body?.device_code === "string" ? body.device_code : "";
      if (!/^[0-9]{6}$/.test(rawCode)) {
        return new Response(JSON.stringify({ error: "code_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userRes.user.id)
        .maybeSingle();
      const businessId = profile?.business_id;
      if (!businessId) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: membership } = await supabase
        .from("business_memberships")
        .select("role")
        .eq("user_id", userRes.user.id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (!membership || !["admin", "manager"].includes(membership.role)) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: device } = await supabase
        .from("devices")
        .select("id, business_id, code_expires_at, device_model, resolution, network_type, app_version, os_version")
        .eq("device_code", rawCode)
        .maybeSingle();

      if (!device) {
        await logAttempt(supabase, { ip, code: rawCode, businessId, success: false, reason: "lookup_not_found", ua });
        return new Response(JSON.stringify({ error: "code_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (device.business_id) {
        return new Response(JSON.stringify({ error: "code_already_used" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (device.code_expires_at && new Date(device.code_expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: "code_expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        device_model: device.device_model ?? null,
        resolution: device.resolution ?? null,
        network_type: device.network_type ?? null,
        app_version: device.app_version ?? null,
        os_version: device.os_version ?? null,
        expires_at: device.code_expires_at ?? null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // POST /pair-device/claim — dashboard claims a code for its business.
    // Requires the caller's Supabase JWT (Authorization: Bearer <access_token>).
    if (req.method === "POST" && path === "claim") {
      if (rateLimited(`claim:${ip}`, RL_MAX.claim)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (await isBruteForced(supabase, ip)) {
        return new Response(JSON.stringify({ error: "Too many failed attempts. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authHeader = req.headers.get("authorization") ?? "";
      const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (!jwt) {
        await logAttempt(supabase, { ip, code: null, businessId: null, success: false, reason: "no_jwt", ua });
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: userRes, error: userErr } = await supabase.auth.getUser(jwt);
      if (userErr || !userRes?.user) {
        await logAttempt(supabase, { ip, code: null, businessId: null, success: false, reason: "invalid_jwt", ua });
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userId = userRes.user.id;

      const body = await req.json().catch(() => ({}));
      const { device_code, screen_name, location_id, timezone } = body ?? {};
      if (!device_code || !/^[0-9]{6}$/.test(device_code)) {
        await logAttempt(supabase, { ip, code: device_code ?? null, businessId: null, success: false, reason: "bad_code_format", ua });
        return new Response(JSON.stringify({ error: "Invalid code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resolve caller's business + membership role
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", userId)
        .maybeSingle();
      const businessId = profile?.business_id;
      if (!businessId) {
        await logAttempt(supabase, { ip, code: device_code, businessId: null, success: false, reason: "no_business", ua });
        return new Response(JSON.stringify({ error: "No business associated with user" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: membership } = await supabase
        .from("business_memberships")
        .select("role")
        .eq("user_id", userId)
        .eq("business_id", businessId)
        .maybeSingle();
      if (!membership || !["admin", "manager"].includes(membership.role)) {
        await logAttempt(supabase, { ip, code: device_code, businessId, success: false, reason: "insufficient_role", ua });
        return new Response(JSON.stringify({ error: "Only admin or manager can pair devices" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: device } = await supabase
        .from("devices")
        .select("id, status, business_id, code_expires_at, code_source")
        .eq("device_code", device_code)
        .maybeSingle();
      if (!device) {
        await logAttempt(supabase, { ip, code: device_code, businessId, success: false, reason: "not_found", ua });
        return new Response(JSON.stringify({ error: "code_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (device.business_id) {
        await logAttempt(supabase, { ip, code: device_code, businessId, success: false, reason: "already_claimed", ua });
        return new Response(JSON.stringify({ error: "code_already_used" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (device.code_expires_at && new Date(device.code_expires_at).getTime() < Date.now()) {
        await logAttempt(supabase, { ip, code: device_code, businessId, success: false, reason: "expired", ua });
        return new Response(JSON.stringify({ error: "code_expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resolve or create location
      let locId = location_id as string | undefined;
      if (!locId) {
        const { data: loc } = await supabase
          .from("locations")
          .select("id")
          .eq("business_id", businessId)
          .limit(1)
          .maybeSingle();
        locId = loc?.id;
        if (!locId) {
          const { data: newLoc } = await supabase
            .from("locations")
            .insert({ name: "Principal", business_id: businessId })
            .select("id")
            .single();
          locId = newLoc?.id;
        }
      }
      if (!locId) {
        await logAttempt(supabase, { ip, code: device_code, businessId, success: false, reason: "no_location", ua });
        return new Response(JSON.stringify({ error: "Location unavailable" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create the screen this device will drive
      const finalName = (typeof screen_name === "string" && screen_name.trim()) ? screen_name.trim().slice(0, 40) : "Pantalla";
      const { data: screen, error: screenErr } = await supabase
        .from("screens")
        .insert({ name: finalName, location_id: locId })
        .select("id")
        .single();
      if (screenErr || !screen) {
        await logAttempt(supabase, { ip, code: device_code, businessId, success: false, reason: "screen_create_failed", ua });
        return new Response(JSON.stringify({ error: "Screen creation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate heartbeat token (returned once to the TV via /status)
      const heartbeatToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");

      const { error: updErr } = await supabase
        .from("devices")
        .update({
          business_id: businessId,
          location_id: locId,
          screen_id: screen.id,
          screen_name: finalName,
          status: "paired",
          paired_at: new Date().toISOString(),
          heartbeat_token: heartbeatToken,
        })
        .eq("id", device.id);
      if (updErr) {
        await supabase.from("screens").delete().eq("id", screen.id);
        await logAttempt(supabase, { ip, code: device_code, businessId, success: false, reason: "device_update_failed", ua });
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await logAttempt(supabase, { ip, code: device_code, businessId, success: true, reason: "ok", ua });
      return new Response(JSON.stringify({
        device_id: device.id,
        screen_id: screen.id,
        business_id: businessId,
      }), {
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
        .select("id, status, screen_id, deleted_at")
        .maybeSingle();

      if (error || !device) {
        return new Response(JSON.stringify({ error: "Device not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Pantalla eliminada: el reproductor borra token y caché y vuelve al código.
      if (device.deleted_at) {
        return new Response(
          JSON.stringify({ status: "unpaired", reason: "screen_deleted", unpair: true }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
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
          .select("id, playlist_id, playlists(id, name, playlist_items(id, sort_order, content(id, name, file_url, type, duration_seconds, expires_at)))")
          .eq("screen_id", device.screen_id)
          .eq("is_active", true)
          .order("start_time", { ascending: false })
          .limit(1)
          .maybeSingle();

        // El player nunca reproduce contenido vencido.
        const nowIso = Date.now();
        if (schedule?.playlists?.playlist_items) {
          (schedule as any).playlists.playlist_items = (schedule as any).playlists.playlist_items.filter(
            (it: any) => {
              const exp = it?.content?.expires_at;
              return !exp || new Date(exp).getTime() > nowIso;
            },
          );
        }
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
