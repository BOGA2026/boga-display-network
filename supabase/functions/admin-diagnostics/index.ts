// Diagnóstico de soporte para super-admins.
//
// Solo lectura sobre los datos del cliente: devuelve el estado técnico de un
// negocio (pantallas, latidos, programación vigente, contenido, errores,
// suscripción y actividad) sin suplantar al usuario ni permitir editar nada.
//
// Las únicas acciones permitidas actúan sobre nuestra infraestructura:
//   - force_sync: encola un comando RELOAD a los reproductores
//   - regenerate_thumbnails: reprocesa miniaturas en error
// Toda apertura y toda acción queda registrada en platform_admin_audit.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsData, error: claimsError } = await anon.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claimsData.claims.sub as string;

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Solo super-admins de plataforma.
  const { data: isAdmin } = await admin
    .from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!isAdmin) return json({ error: "No autorizado" }, 403);

  const { data: actor } = await admin
    .from("profiles").select("full_name").eq("id", userId).maybeSingle();

  let body: { business_id?: string; action?: string; screen_ids?: string[] } = {};
  try { body = await req.json(); } catch { /* sin cuerpo */ }

  const businessId = body.business_id ?? "";
  if (!UUID_RE.test(businessId)) return json({ error: "business_id inválido" }, 400);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent");

  const logEvent = async (action: string, details: Record<string, unknown> = {}) => {
    await admin.from("platform_admin_audit").insert({
      action,
      actor_id: userId,
      actor_email: (claimsData.claims as Record<string, unknown>).email ?? null,
      target_email: `business:${businessId}`,
      ip,
      user_agent: userAgent,
      details: { business_id: businessId, actor_name: actor?.full_name ?? null, ...details },
    });
  };

  const action = body.action ?? "report";

  /* ── Acciones sobre nuestra infraestructura ───────────────────────── */

  if (action === "force_sync") {
    const ids = (body.screen_ids ?? []).filter((id) => UUID_RE.test(id));
    if (ids.length === 0) return json({ error: "Sin pantallas" }, 400);
    // Verifica que las pantallas pertenezcan al negocio indicado.
    const { data: owned } = await admin
      .from("screens")
      .select("id, locations!inner(business_id)")
      .is("deleted_at", null)
      .in("id", ids);
    const valid = (owned ?? [])
      .filter((s: Record<string, any>) => s.locations?.business_id === businessId)
      .map((s: Record<string, any>) => s.id as string);
    if (valid.length === 0) return json({ error: "Sin pantallas del negocio" }, 400);

    const expires = new Date(Date.now() + 10 * 60_000).toISOString();
    const { error } = await admin.from("screen_commands").insert(
      valid.map((screen_id) => ({
        screen_id,
        command: "RELOAD",
        payload: { source: "admin_diagnostics" },
        status: "pending",
        expires_at: expires,
      })),
    );
    if (error) return json({ error: error.message }, 500);
    await logEvent("diagnostics_force_sync", { screens: valid.length });
    return json({ ok: true, screens: valid.length });
  }

  if (action === "regenerate_thumbnails") {
    const { data: broken } = await admin
      .from("content")
      .select("id")
      .eq("business_id", businessId)
      .in("type", ["layout", "menu", "preset"])
      .or("thumbnail_status.eq.error,thumbnail_url.is.null")
      .limit(25);
    const ids = (broken ?? []).map((c: Record<string, any>) => c.id as string);
    if (ids.length === 0) {
      await logEvent("diagnostics_regenerate_thumbnails", { processed: 0 });
      return json({ ok: true, processed: 0 });
    }
    await admin.from("content").update({ thumbnail_status: "pendiente" }).in("id", ids);
    let processed = 0;
    for (const id of ids) {
      const res = await fetch(`${url}/functions/v1/render-thumbnail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
        },
        body: JSON.stringify({ content_id: id, business_id: businessId }),
      });
      if (res.ok) processed += 1;
    }
    await logEvent("diagnostics_regenerate_thumbnails", { processed, requested: ids.length });
    return json({ ok: true, processed, requested: ids.length });
  }

  if (action !== "report") return json({ error: "Acción no permitida" }, 400);

  /* ── Informe (solo lectura) ───────────────────────────────────────── */

  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [bizRes, screensRes, contentRes, playlistItemsRes, blocksRes, subRes, paymentsRes, pmRes, auditRes] =
    await Promise.all([
      admin.from("businesses").select("id, name, timezone, created_at").eq("id", businessId).maybeSingle(),
      admin
        .from("screens")
        .select(
          "id, name, status, last_seen_at, app_version, license_status, device_type, device_model, os_version, schedule_version, rotation, location_id, locations!inner(id, name, business_id)",
        )
        .eq("locations.business_id", businessId)
        .is("deleted_at", null)
        .order("name"),
      admin
        .from("content")
        .select("id, name, type, thumbnail_status, thumbnail_url, file_size_bytes, created_at")
        .eq("business_id", businessId),
      admin.from("playlist_items").select("content_id, playlists!inner(business_id)").eq("playlists.business_id", businessId),
      admin
        .from("schedule_blocks")
        .select("id, name, screen_id, start_time, end_time, days_of_week, start_date, end_date, is_enabled, playlists(name)")
        .eq("business_id", businessId),
      admin
        .from("subscriptions")
        .select("id, plan, status, billing_cycle, screens_count, price_per_screen, total_amount, next_billing_date, grace_period_ends_at, expires_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("payments")
        .select("id, amount, status, payment_method, invoice_number, created_at, payment_type")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10),
      admin.from("payment_methods").select("id, brand, last4, exp_month, exp_year, is_default").eq("business_id", businessId),
      admin
        .from("audit_log")
        .select("id, action, entity_type, entity_id, details, created_at, actor_id, user_agent")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const screens = (screensRes.data ?? []) as Record<string, any>[];
  const screenIds = screens.map((s) => s.id as string);

  const [heartbeatsRes, playbackRes, errorsRes, pubsRes, membersRes] = await Promise.all([
    screenIds.length
      ? admin
          .from("screen_heartbeats")
          .select("screen_id, ts, app_version, cpu_pct, mem_pct, net_kbps")
          .in("screen_id", screenIds)
          .gte("ts", since30d)
          .order("ts", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as Record<string, any>[] }),
    screenIds.length
      ? admin
          .from("playback_events")
          .select("id, screen_id, content_id, playlist_id, started_at, duration_ms, interrupted, content(name)")
          .in("screen_id", screenIds)
          .order("started_at", { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [] as Record<string, any>[] }),
    screenIds.length
      ? admin
          .from("playback_events")
          .select("id, screen_id, content_id, started_at, duration_ms, content(name)")
          .in("screen_id", screenIds)
          .eq("interrupted", true)
          .order("started_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as Record<string, any>[] }),
    admin
      .from("schedule_publications")
      .select("id, screen_id, status, error, sent_at")
      .eq("business_id", businessId)
      .order("sent_at", { ascending: false })
      .limit(20),
    admin.from("business_memberships").select("user_id, role, created_at").eq("business_id", businessId),
  ]);

  // Último latido por pantalla.
  const lastHeartbeat: Record<string, Record<string, any>> = {};
  for (const h of (heartbeatsRes.data ?? []) as Record<string, any>[]) {
    if (!lastHeartbeat[h.screen_id]) lastHeartbeat[h.screen_id] = h;
  }
  // Última reproducción por pantalla.
  const lastPlayback: Record<string, Record<string, any>> = {};
  for (const p of (playbackRes.data ?? []) as Record<string, any>[]) {
    if (!lastPlayback[p.screen_id]) lastPlayback[p.screen_id] = p;
  }

  const versions = screens
    .map((s) => (lastHeartbeat[s.id]?.app_version ?? s.app_version) as string | null)
    .filter(Boolean) as string[];
  const latestVersion = versions.sort().at(-1) ?? null;

  const content = (contentRes.data ?? []) as Record<string, any>[];
  const usedIds = new Set(((playlistItemsRes.data ?? []) as Record<string, any>[]).map((i) => i.content_id));

  const report = {
    generated_at: new Date().toISOString(),
    business: bizRes.data ?? { id: businessId, name: "—", timezone: "America/Bogota" },
    latest_app_version: latestVersion,
    screens: screens.map((s) => {
      const hb = lastHeartbeat[s.id] ?? null;
      const pb = lastPlayback[s.id] ?? null;
      return {
        id: s.id,
        name: s.name,
        location_name: s.locations?.name ?? "Sin sede",
        status: s.status,
        last_seen_at: s.last_seen_at,
        license_status: s.license_status,
        device_type: s.device_type,
        device_model: s.device_model,
        os_version: s.os_version,
        schedule_version: s.schedule_version,
        app_version: hb?.app_version ?? s.app_version ?? null,
        heartbeat: hb
          ? { ts: hb.ts, cpu_pct: hb.cpu_pct, mem_pct: hb.mem_pct, net_kbps: hb.net_kbps }
          : null,
        last_playback: pb
          ? {
              content_id: pb.content_id,
              content_name: pb.content?.name ?? null,
              started_at: pb.started_at,
              duration_ms: pb.duration_ms,
              interrupted: pb.interrupted,
            }
          : null,
      };
    }),
    schedule_blocks: ((blocksRes.data ?? []) as Record<string, any>[]).map((b) => ({
      id: b.id,
      name: b.name,
      screen_id: b.screen_id,
      start_time: String(b.start_time).slice(0, 5),
      end_time: String(b.end_time).slice(0, 5),
      days_of_week: b.days_of_week ?? [],
      start_date: b.start_date,
      end_date: b.end_date,
      is_enabled: b.is_enabled,
      playlist_name: b.playlists?.name ?? null,
    })),
    content: {
      total: content.length,
      in_playlists: content.filter((c) => usedIds.has(c.id)).length,
      orphans: content.filter((c) => !usedIds.has(c.id)).map((c) => ({ id: c.id, name: c.name, type: c.type })),
      thumbnail_errors: content
        .filter((c) => c.thumbnail_status === "error")
        .map((c) => ({ id: c.id, name: c.name })),
      heavy_files: content
        .filter((c) => Number(c.file_size_bytes ?? 0) > 100 * 1024 * 1024)
        .map((c) => ({ id: c.id, name: c.name, mb: Math.round(Number(c.file_size_bytes) / 1048576) })),
    },
    errors: [
      ...((errorsRes.data ?? []) as Record<string, any>[]).map((e) => ({
        at: e.started_at,
        kind: "playback" as const,
        message: `Reproducción interrumpida: ${e.content?.name ?? "contenido eliminado"}`,
        screen_id: e.screen_id,
      })),
      ...((pubsRes.data ?? []) as Record<string, any>[])
        .filter((p) => p.status === "error" || p.error)
        .map((p) => ({
          at: p.sent_at,
          kind: "schedule" as const,
          message: `Fallo al publicar programación: ${p.error ?? "sin detalle"}`,
          screen_id: p.screen_id,
        })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 20),
    subscription: subRes.data ?? null,
    payments: paymentsRes.data ?? [],
    // Métodos de pago SIEMPRE enmascarados: marca + últimos cuatro. Nunca el token.
    payment_methods: ((pmRes.data ?? []) as Record<string, any>[]).map((m) => ({
      id: m.id,
      brand: m.brand,
      masked: `•••• ${String(m.last4 ?? "").slice(-4)}`,
      expires: `${String(m.exp_month).padStart(2, "0")}/${String(m.exp_year).slice(-2)}`,
      is_default: m.is_default,
    })),
    members_total: (membersRes.data ?? []).length,
    activity: ((auditRes.data ?? []) as Record<string, any>[]).map((a) => ({
      at: a.created_at,
      action: a.action,
      entity: a.entity_type,
      entity_id: a.entity_id,
      details: a.details,
      user_agent: a.user_agent ?? null,
    })),
  };

  await logEvent("diagnostics_viewed", { screens: screens.length });

  return json(report);
});
