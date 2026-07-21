// Public QR redirect: /qr-redirect?slug=abc → instant 302, logs scan in background.
//
// Design decisions:
//  - `verify_jwt = false` (public, no auth) — anyone with a QR must reach the destination.
//  - The DB lookup for target_url IS awaited (we can't redirect without it), but every
//    non-critical enrichment (device parsing, geo IP lookup, insert) runs inside
//    EdgeRuntime.waitUntil AFTER the response is sent. The end user perceives an
//    instant hop.
//  - Geo enrichment tries free ip-api.com with a 1.5s timeout. If it times out or
//    fails, we still record the scan with device_type + user_agent — country/city
//    are best-effort, never blocking.
import { createClient } from "npm:@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

function detectDeviceType(ua: string | null): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/ipad|tablet|kindle|playbook|silk/.test(lower)) return "tablet";
  if (/mobi|iphone|android.*mobile|phone|blackberry|opera mini/.test(lower)) return "mobile";
  if (/android/.test(lower)) return "tablet"; // Android without "mobile" keyword → tablet-ish
  if (/mozilla|chrome|safari|firefox|edge|opera/.test(lower)) return "desktop";
  return "unknown";
}

function firstHeader(req: Request, name: string): string | null {
  return req.headers.get(name)?.split(",")[0]?.trim() ?? null;
}

async function lookupGeo(ip: string | null): Promise<{ country: string | null; city: string | null }> {
  if (!ip || ip === "127.0.0.1" || ip.startsWith("::") || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return { country: null, city: null };
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return { country: null, city: null };
    const j = (await r.json()) as { status?: string; country?: string; city?: string };
    if (j.status !== "success") return { country: null, city: null };
    return { country: j.country ?? null, city: j.city ?? null };
  } catch {
    return { country: null, city: null };
  }
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug")?.trim();
    // Optional: the content player passes `?from=<screen_id>` when the QR is rendered
    // inside a scheduled piece so we know which physical screen originated the scan.
    const fromScreen = url.searchParams.get("from")?.trim() || null;

    if (!slug || !/^[a-zA-Z0-9_-]{1,64}$/.test(slug)) {
      return new Response("Missing or invalid slug", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // The only awaited work: look up the destination. Any longer than this
    // and the QR feels broken.
    const { data: qr, error } = await supabase
      .from("qr_codes")
      .select("id, target_url, active")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !qr) return new Response("QR no encontrado", { status: 404 });
    if (qr.active === false) return new Response("QR desactivado", { status: 410 });

    const ua = req.headers.get("user-agent");
    const ip = firstHeader(req, "x-forwarded-for") || firstHeader(req, "cf-connecting-ip");
    // Fast-path headers Cloudflare/Deno-Deploy sometimes populate — free, no HTTP call.
    const headerCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-country-code") || null;

    const logScan = async () => {
      const device_type = detectDeviceType(ua);
      const geo = headerCountry ? { country: headerCountry, city: null } : await lookupGeo(ip);
      await supabase.from("qr_scans").insert({
        qr_code_id: qr.id,
        user_agent: ua?.slice(0, 500) ?? null,
        referrer: req.headers.get("referer")?.slice(0, 500) ?? null,
        device_type,
        country: geo.country,
        city: geo.city,
        screen_id: fromScreen,
      });
    };

    // Push the scan write off the critical path. If EdgeRuntime.waitUntil is
    // available (Supabase Edge Functions expose it), Deno keeps the promise
    // alive after the response is flushed; otherwise fire-and-forget is fine
    // because Deno.serve doesn't hard-terminate pending microtasks.
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(logScan().catch((e) => console.error("scan log failed", e)));
    } else {
      logScan().catch((e) => console.error("scan log failed", e));
    }

    return new Response(null, {
      status: 302,
      headers: { Location: qr.target_url, "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("qr-redirect error", e);
    return new Response("Internal error", { status: 500 });
  }
});
