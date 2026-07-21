/**
 * ai-studio — bridge between the dashboard and the Lovable AI Gateway.
 *
 * Every request is authenticated with the caller's Supabase JWT so RLS
 * enforces tenant isolation: no prompt, no asset, no history leaks across
 * businesses. Also called by the Visualia MCP tools so a WhatsApp bot or an
 * external agent hits the same quota/logging code path.
 *
 * Routes:
 *   POST /ai-studio/generate_image        { prompt, formato, watermark_off?, apply_brand_kit? }
 *   POST /ai-studio/generate_video_loop   { prompt, duracion_segundos, formato }
 *   POST /ai-studio/suggest_copy          { tipo_promocion, contexto_negocio? }
 *   POST /ai-studio/apply_brand_kit       { generation_id }
 *   GET  /ai-studio/usage                 → { used, limit, remaining, resets_at }
 *   GET  /ai-studio/history?limit=20      → [{ ... }]
 *   POST /ai-studio/cancel                { generation_id }
 *
 * Every generation row is created BEFORE the model call so a cancelled or
 * timed-out request still leaves a trace the panel can show and the user
 * can retry.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";
const TEXT_MODEL = "google/gemini-2.5-flash";

type Tool = "generate_image" | "generate_video_loop" | "suggest_copy" | "apply_brand_kit";

const jsonError = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const jsonOk = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const supabasePublishable = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

const supabaseAsUser = (jwt: string) =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

const supabaseService = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const jwt = authHeader.slice(7);
  const { data, error } = await supabasePublishable().auth.getClaims(jwt);
  if (error || !data?.claims) return null;
  return { jwt, userId: data.claims.sub as string, email: (data.claims.email as string) ?? null };
}

async function loadTenant(userId: string) {
  // Prefer explicit business membership (multi-tenant). Fall back to profiles.business_id.
  const svc = supabaseService();
  const { data: mem } = await svc
    .from("business_memberships")
    .select("business_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (mem?.business_id) return { businessId: mem.business_id as string, role: mem.role as string };
  const { data: prof } = await svc
    .from("profiles")
    .select("business_id")
    .eq("id", userId)
    .maybeSingle();
  if (prof?.business_id) return { businessId: prof.business_id as string, role: "member" };
  return null;
}

async function readUsage(businessId: string) {
  const svc = supabaseService();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const nextMonth = new Date(monthStart);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  const [{ count }, { data: biz }] = await Promise.all([
    svc
      .from("ai_generations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["completed", "pending"])
      .gte("created_at", monthStart.toISOString()),
    svc.from("businesses").select("ai_monthly_limit").eq("id", businessId).single(),
  ]);

  const limit = biz?.ai_monthly_limit ?? 100;
  const used = count ?? 0;
  return { used, limit, remaining: Math.max(0, limit - used), resets_at: nextMonth.toISOString() };
}

async function createGeneration(params: {
  businessId: string;
  userId: string;
  tool: Tool;
  prompt: string | null;
  paramsJson: Record<string, unknown>;
  source: "dashboard" | "mcp";
}) {
  const svc = supabaseService();
  const { data, error } = await svc
    .from("ai_generations")
    .insert({
      business_id: params.businessId,
      user_id: params.userId,
      tool: params.tool,
      prompt: params.prompt,
      params: params.paramsJson,
      status: "pending",
      source: params.source,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to log generation");
  return data.id as string;
}

async function finalizeGeneration(
  id: string,
  patch: {
    status: "completed" | "failed" | "cancelled";
    output_url?: string | null;
    output_text?: string | null;
    tokens_used?: number;
    cost_cents?: number;
    error?: string | null;
  },
) {
  await supabaseService().from("ai_generations").update(patch).eq("id", id);
}

async function callGateway(body: unknown, signal: AbortSignal) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  const resp = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify(body),
  });
  if (resp.status === 402) throw Object.assign(new Error("Se agotaron los créditos de IA de Visualia."), { code: 402 });
  if (resp.status === 429) throw Object.assign(new Error("La IA está saturada, intenta de nuevo en unos segundos."), { code: 429 });
  if (!resp.ok) throw Object.assign(new Error(`Gateway ${resp.status}: ${(await resp.text()).slice(0, 200)}`), { code: resp.status });
  return await resp.json();
}

async function uploadImageDataUri(businessId: string, dataUri: string) {
  const match = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(dataUri);
  if (!match) throw new Error("Modelo no devolvió una imagen válida.");
  const contentType = match[1];
  const ext = contentType.split("/")[1].split("+")[0];
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  const path = `ai/${businessId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseService().storage.from("media").upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabaseService().storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Schemas ─────────────────────────────────────────────────────────────

const generateImageSchema = z.object({
  prompt: z.string().min(3).max(2000),
  formato: z.enum(["16:9", "9:16", "1:1", "4:5"]).default("16:9"),
  watermark_off: z.boolean().optional().default(false),
  apply_brand_kit: z.boolean().optional().default(true),
});

const generateVideoSchema = z.object({
  prompt: z.string().min(3).max(2000),
  duracion_segundos: z.number().int().min(3).max(15).default(6),
  formato: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
});

const suggestCopySchema = z.object({
  tipo_promocion: z.string().min(2).max(120),
  contexto_negocio: z.string().max(1500).optional(),
});

const applyBrandKitSchema = z.object({
  generation_id: z.string().uuid(),
});

const cancelSchema = z.object({
  generation_id: z.string().uuid(),
});

// ─── Route handlers ──────────────────────────────────────────────────────

async function handleGenerateImage(
  input: z.infer<typeof generateImageSchema>,
  ctx: { businessId: string; userId: string; source: "dashboard" | "mcp"; signal: AbortSignal },
) {
  const svc = supabaseService();
  let brandLine = "";
  if (input.apply_brand_kit) {
    const { data: kit } = await svc.from("brand_kits").select("*").eq("business_id", ctx.businessId).maybeSingle();
    if (kit) {
      brandLine = ` Usa esta paleta de marca: primario ${kit.primary_color}, secundario ${kit.secondary_color}${kit.accent_color ? `, acento ${kit.accent_color}` : ""}.${kit.font_family ? ` Tipografía sugerida: ${kit.font_family}.` : ""}`;
    }
  }
  const wm = input.watermark_off ? "" : " Incluye un discreto watermark 'visualia' en la esquina inferior derecha.";
  const finalPrompt = `${input.prompt}. Formato ${input.formato}, alta calidad, iluminación profesional para digital signage.${brandLine}${wm}`;

  const genId = await createGeneration({
    businessId: ctx.businessId,
    userId: ctx.userId,
    tool: "generate_image",
    prompt: input.prompt,
    paramsJson: input,
    source: ctx.source,
  });

  try {
    const data = await callGateway(
      {
        model: IMAGE_MODEL,
        messages: [{ role: "user", content: finalPrompt }],
        modalities: ["image", "text"],
      },
      ctx.signal,
    );
    const images: string[] = data?.choices?.[0]?.message?.images ?? [];
    const imageUrl = images[0]?.image_url?.url ?? images[0]?.url ?? images[0];
    if (!imageUrl) throw new Error("El modelo no devolvió imagen.");
    const publicUrl = await uploadImageDataUri(ctx.businessId, imageUrl);
    const tokens = data?.usage?.total_tokens ?? 0;
    await finalizeGeneration(genId, {
      status: "completed",
      output_url: publicUrl,
      tokens_used: tokens,
      cost_cents: Math.ceil(tokens / 1000),
    });
    return { id: genId, url: publicUrl, tokens_used: tokens };
  } catch (err) {
    const aborted = ctx.signal.aborted;
    await finalizeGeneration(genId, {
      status: aborted ? "cancelled" : "failed",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

async function handleGenerateVideoLoop(
  input: z.infer<typeof generateVideoSchema>,
  ctx: { businessId: string; userId: string; source: "dashboard" | "mcp"; signal: AbortSignal },
) {
  // Native short-loop video generation is not yet exposed by the gateway.
  // We produce a high-quality still frame so the tool contract is stable and
  // the caller can loop it client-side; a follow-up will swap in a real
  // video model without changing the response shape.
  const still = await handleGenerateImage(
    {
      prompt: `Fotograma clave para un video en loop de ${input.duracion_segundos}s: ${input.prompt}`,
      formato: input.formato,
      watermark_off: false,
      apply_brand_kit: true,
    },
    ctx,
  );
  return { ...still, is_video: false, duracion_segundos: input.duracion_segundos, note: "loop_preview_still" };
}

async function handleSuggestCopy(
  input: z.infer<typeof suggestCopySchema>,
  ctx: { businessId: string; userId: string; source: "dashboard" | "mcp"; signal: AbortSignal },
) {
  const svc = supabaseService();
  const { data: biz } = await svc.from("businesses").select("name").eq("id", ctx.businessId).single();
  const context = input.contexto_negocio
    ? input.contexto_negocio
    : `Negocio: ${biz?.name ?? "restaurante"}. Segmento: gastronomía en Colombia. Idioma: español colombiano tú.`;

  const genId = await createGeneration({
    businessId: ctx.businessId,
    userId: ctx.userId,
    tool: "suggest_copy",
    prompt: input.tipo_promocion,
    paramsJson: input,
    source: ctx.source,
  });

  try {
    const data = await callGateway(
      {
        model: TEXT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Eres copywriter de menús para restaurantes en Colombia. Devuelve JSON: {\"titulo\": string (max 40 chars), \"subtitulo\": string (max 80 chars), \"cta\": string (max 20 chars)}. Solo el JSON, sin texto extra. Español colombiano tú, sin jerga técnica.",
          },
          {
            role: "user",
            content: `Genera copy para: ${input.tipo_promocion}\n\nContexto:\n${context}`,
          },
        ],
        response_format: { type: "json_object" },
      },
      ctx.signal,
    );
    const raw = data?.choices?.[0]?.message?.content ?? "";
    let parsed: { titulo?: string; subtitulo?: string; cta?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { titulo: raw.slice(0, 40), subtitulo: "", cta: "" };
    }
    const tokens = data?.usage?.total_tokens ?? 0;
    await finalizeGeneration(genId, {
      status: "completed",
      output_text: JSON.stringify(parsed),
      tokens_used: tokens,
      cost_cents: Math.ceil(tokens / 5000),
    });
    return { id: genId, copy: parsed, tokens_used: tokens };
  } catch (err) {
    const aborted = ctx.signal.aborted;
    await finalizeGeneration(genId, {
      status: aborted ? "cancelled" : "failed",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

async function handleApplyBrandKit(
  input: z.infer<typeof applyBrandKitSchema>,
  ctx: { businessId: string; userId: string; source: "dashboard" | "mcp"; signal: AbortSignal },
) {
  const svc = supabaseService();
  const { data: source, error } = await svc
    .from("ai_generations")
    .select("id, business_id, prompt, output_url, params")
    .eq("id", input.generation_id)
    .single();
  if (error || !source) throw new Error("Generation not found.");
  if (source.business_id !== ctx.businessId) throw new Error("Cross-tenant access denied.");
  const { data: kit } = await svc.from("brand_kits").select("*").eq("business_id", ctx.businessId).maybeSingle();
  if (!kit) throw new Error("Este negocio aún no tiene brand kit configurado.");

  // Re-run image generation with an explicit brand-kit reinforcement prompt.
  return await handleGenerateImage(
    {
      prompt: `${source.prompt ?? ""} Reinterpretalo usando colores ${kit.primary_color}/${kit.secondary_color}, con logo si aplica.`,
      formato: (source.params as { formato?: "16:9" | "9:16" | "1:1" | "4:5" })?.formato ?? "16:9",
      watermark_off: kit.watermark_disabled,
      apply_brand_kit: true,
    },
    ctx,
  );
}

// ─── Entry ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await authenticate(req);
  if (!auth) return jsonError(401, "No autenticado.");

  const tenant = await loadTenant(auth.userId);
  if (!tenant) return jsonError(403, "El usuario no está asociado a un negocio.");

  const url = new URL(req.url);
  const route = url.pathname.split("/").filter(Boolean).pop() ?? "";

  try {
    if (req.method === "GET" && route === "usage") {
      return jsonOk(await readUsage(tenant.businessId));
    }

    if (req.method === "GET" && route === "history") {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
      const user = supabaseAsUser(auth.jwt);
      const { data, error } = await user
        .from("ai_generations")
        .select("id, tool, prompt, output_url, output_text, status, created_at, tokens_used")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return jsonError(500, error.message);
      return jsonOk({ items: data });
    }

    if (req.method !== "POST") return jsonError(405, "Method not allowed.");

    if (route === "cancel") {
      const parsed = cancelSchema.safeParse(await req.json());
      if (!parsed.success) return jsonError(400, parsed.error.message);
      const user = supabaseAsUser(auth.jwt);
      const { error } = await user
        .from("ai_generations")
        .update({ status: "cancelled" })
        .eq("id", parsed.data.generation_id)
        .eq("status", "pending");
      if (error) return jsonError(500, error.message);
      return jsonOk({ ok: true });
    }

    // All generative routes enforce the monthly limit.
    const usage = await readUsage(tenant.businessId);
    if (usage.remaining <= 0) {
      return jsonError(429, `Alcanzaste el límite mensual de ${usage.limit} generaciones. Se renueva el ${usage.resets_at.slice(0, 10)}.`);
    }

    const source: "dashboard" | "mcp" =
      (req.headers.get("X-Visualia-Source") as "mcp" | null) === "mcp" ? "mcp" : "dashboard";
    const ctx = { businessId: tenant.businessId, userId: auth.userId, source, signal: req.signal };

    if (route === "generate_image") {
      const parsed = generateImageSchema.safeParse(await req.json());
      if (!parsed.success) return jsonError(400, parsed.error.message);
      return jsonOk(await handleGenerateImage(parsed.data, ctx));
    }
    if (route === "generate_video_loop") {
      const parsed = generateVideoSchema.safeParse(await req.json());
      if (!parsed.success) return jsonError(400, parsed.error.message);
      return jsonOk(await handleGenerateVideoLoop(parsed.data, ctx));
    }
    if (route === "suggest_copy") {
      const parsed = suggestCopySchema.safeParse(await req.json());
      if (!parsed.success) return jsonError(400, parsed.error.message);
      return jsonOk(await handleSuggestCopy(parsed.data, ctx));
    }
    if (route === "apply_brand_kit") {
      const parsed = applyBrandKitSchema.safeParse(await req.json());
      if (!parsed.success) return jsonError(400, parsed.error.message);
      return jsonOk(await handleApplyBrandKit(parsed.data, ctx));
    }

    return jsonError(404, `Ruta desconocida: ${route}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: number })?.code ?? 500;
    console.error("ai-studio error", message);
    return jsonError(code === 429 || code === 402 ? code : 500, message);
  }
});
