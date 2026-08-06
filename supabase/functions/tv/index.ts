// Redirección corta y permanente al APK del reproductor.
// GET  /tv          -> 302 al APK más reciente del bucket "downloads"
// GET  /tv/version  -> texto plano con versión y fecha de compilación
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const APK_FILE = "visualia-tv.apk";
const LEGACY_FILE = "visualia-firetv.apk";
const BUCKET = "downloads";
const publicUrl = (f: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${f}`;
const APK_VERSION = "1.0.0";
const APK_BUILD_DATE = "2026-04-27"; // fecha de compilación del binario

async function exists(file: string): Promise<Response | null> {
  const res = await fetch(publicUrl(file), { method: "HEAD" });
  return res.ok ? res : null;
}

// El archivo se llamaba visualia-firetv.apk. Copiamos una sola vez al nombre
// nuevo (idempotente) para que la URL corta nunca dependa del nombre viejo.
async function ensureCurrentFile(): Promise<Response | null> {
  const head = await exists(APK_FILE);
  if (head) return head;

  const legacy = await exists(LEGACY_FILE);
  if (!legacy) return null;

  const copy = await fetch(`${SUPABASE_URL}/storage/v1/object/copy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
    body: JSON.stringify({
      bucketId: BUCKET,
      sourceKey: LEGACY_FILE,
      destinationKey: APK_FILE,
    }),
  });
  if (!copy.ok) {
    console.error(`copy failed [${copy.status}]: ${await copy.text()}`);
    return legacy;
  }
  return (await exists(APK_FILE)) ?? legacy;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/tv/, "").replace(/\/+$/, "");

  const head = await ensureCurrentFile();
  const served = head && head.url.includes(APK_FILE) ? APK_FILE : LEGACY_FILE;

  if (path === "/version") {
    const lm = head?.headers.get("last-modified");
    const body =
      `Visualia TV\n` +
      `version: ${APK_VERSION}\n` +
      `archivo: ${served}\n` +
      `compilado: ${APK_BUILD_DATE}\n` +
      `publicado: ${lm ? new Date(lm).toISOString() : "desconocido"}\n`;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: publicUrl(served), "Cache-Control": "no-store" },
  });
});
