// Redirección corta y permanente al APK del reproductor.
// GET  /tv          -> 302 al APK más reciente del bucket "downloads"
// GET  /tv/version  -> texto plano con versión y fecha de compilación
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const APK_FILE = "visualia-tv.apk";
const APK_URL = `${SUPABASE_URL}/storage/v1/object/public/downloads/${APK_FILE}`;
const APK_VERSION = "1.0.0";

async function fetchBuildDate(): Promise<string | null> {
  try {
    const head = await fetch(APK_URL, { method: "HEAD" });
    const lm = head.headers.get("last-modified");
    return lm ? new Date(lm).toISOString() : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/tv/, "").replace(/\/+$/, "");

  if (path === "/version") {
    const built = await fetchBuildDate();
    const body =
      `Visualia TV\n` +
      `version: ${APK_VERSION}\n` +
      `archivo: ${APK_FILE}\n` +
      `compilado: ${built ?? "desconocido"}\n`;
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
    headers: { Location: APK_URL, "Cache-Control": "no-store" },
  });
});
