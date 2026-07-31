import { createClient } from "npm:@supabase/supabase-js@2";
import { layoutToNode, renderNodeToPng, type LayoutSpec } from "../_shared/render-image.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THUMB_WIDTH = 480;
const BUCKET = "media";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Decodifica el diseño guardado (data URI base64 con el JSON del editor). */
function decodeLayout(fileUrl: string | null): LayoutSpec | null {
  if (!fileUrl) return null;
  const marker = "base64,";
  const i = fileUrl.indexOf(marker);
  if (i === -1 || !fileUrl.startsWith("data:")) return null;
  try {
    const bytes = Uint8Array.from(atob(fileUrl.slice(i + marker.length)), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsData, error: claimsError } = await anon.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claimsData.claims.sub as string;

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: profile } = await admin
    .from("profiles").select("business_id").eq("id", userId).maybeSingle();
  const businessId = profile?.business_id as string | undefined;
  if (!businessId) return json({ error: "Sin negocio asociado" }, 403);

  let body: { content_id?: string; backfill?: boolean; limit?: number } = {};
  try { body = await req.json(); } catch { /* body vacío */ }

  // Selección de piezas a procesar: una sola, o lote de pendientes (backfill).
  let targets: { id: string; file_url: string | null }[] = [];
  if (body.backfill) {
    const limit = Math.min(Math.max(body.limit ?? 10, 1), 25);
    const { data } = await admin
      .from("content")
      .select("id, file_url")
      .eq("business_id", businessId)
      .in("type", ["layout", "menu", "preset"])
      .is("thumbnail_url", null)
      .limit(limit);
    targets = data ?? [];
  } else {
    if (!body.content_id) return json({ error: "content_id requerido" }, 400);
    const { data } = await admin
      .from("content")
      .select("id, file_url, business_id")
      .eq("id", body.content_id)
      .maybeSingle();
    if (!data || data.business_id !== businessId) return json({ error: "No encontrado" }, 404);
    targets = [{ id: data.id, file_url: data.file_url }];
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const item of targets) {
    try {
      const spec = decodeLayout(item.file_url);
      if (!spec) throw new Error("El diseño no tiene una especificación legible");

      const width = spec.width ?? 1920;
      const height = spec.height ?? 1080;
      const png = await renderNodeToPng(layoutToNode(spec), {
        width,
        height,
        outputWidth: THUMB_WIDTH,
      });

      const path = `thumbnails/${businessId}/${item.id}.png`;
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, png, { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
      await admin.from("content").update({
        thumbnail_url: `${pub.publicUrl}?v=${Date.now()}`,
        thumbnail_status: "listo",
      }).eq("id", item.id);

      results.push({ id: item.id, ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("render-thumbnail falló", item.id, message);
      await admin.from("content").update({ thumbnail_status: "error" }).eq("id", item.id);
      results.push({ id: item.id, ok: false, error: message });
    }
  }

  return json({ processed: results.length, results });
});
