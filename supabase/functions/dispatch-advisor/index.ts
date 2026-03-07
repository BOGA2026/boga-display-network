import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: rows } = await supabase
      .from("advisor_notifications")
      .select("*")
      .eq("status", "pending")
      .lte("send_after", new Date().toISOString())
      .limit(20);

    const webhookUrl = Deno.env.get("ADVISOR_WEBHOOK_URL");
    let sent = 0;
    let failed = 0;

    for (const n of rows ?? []) {
      try {
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(n.payload),
          });
        }

        await supabase
          .from("advisor_notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", n.id);
        sent++;
      } catch (e) {
        console.error("dispatch error for notification", n.id, e);
        await supabase
          .from("advisor_notifications")
          .update({ status: "failed" })
          .eq("id", n.id);
        failed++;
      }
    }

    return Response.json({ ok: true, sent, failed }, { headers: corsHeaders });
  } catch (e) {
    console.error("dispatch-advisor error:", e);
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error desconocido" },
      { status: 500, headers: corsHeaders }
    );
  }
});
