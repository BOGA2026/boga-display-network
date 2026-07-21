// Public QR redirect: /qr-redirect?slug=abc → 302 target_url + inserts qr_scans
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug")?.trim();
    if (!slug || slug.length > 128) {
      return new Response("Missing slug", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: qr, error } = await supabase
      .from("qr_codes")
      .select("id, target_url")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !qr) {
      return new Response("Not found", { status: 404 });
    }

    // Fire-and-forget scan record
    supabase
      .from("qr_scans")
      .insert({
        qr_code_id: qr.id,
        user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
        referrer: req.headers.get("referer")?.slice(0, 500) ?? null,
      })
      .then(() => {});

    return new Response(null, {
      status: 302,
      headers: { Location: qr.target_url, "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("qr-redirect error", e);
    return new Response("Internal error", { status: 500 });
  }
});
