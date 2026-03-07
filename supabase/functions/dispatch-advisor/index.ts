import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function buildSlackBlocks(p: Record<string, unknown>) {
  const fields = [
    { type: "mrkdwn", text: `*Nombre:*\n${p.name ?? "—"}` },
    { type: "mrkdwn", text: `*Empresa:*\n${p.company ?? "—"}` },
    { type: "mrkdwn", text: `*Email:*\n${p.email ?? "—"}` },
    { type: "mrkdwn", text: `*Teléfono:*\n${p.phone ?? "—"}` },
    { type: "mrkdwn", text: `*WhatsApp:*\n${p.whatsapp || p.phone || "—"}` },
    { type: "mrkdwn", text: `*Pantallas:*\n${p.screens ?? "—"}` },
    { type: "mrkdwn", text: `*Objetivo:*\n${p.goal ?? "—"}` },
    { type: "mrkdwn", text: `*Presupuesto:*\n${p.budget ?? "—"}` },
  ];

  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "🔔 Nuevo Lead — Visualia", emoji: true },
    },
    { type: "section", fields },
  ];

  // Preferred time
  if (p.preferred_time) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `🕐 *Hora preferida de contacto:* ${p.preferred_time}` },
    });
  }

  // Inquiry
  if (p.inquiry) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `💬 *Inquietud:*\n${p.inquiry}` },
    });
  }

  blocks.push(
    { type: "divider" },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `Lead ID: \`${p.lead_id}\`` },
      ],
    },
  );

  return blocks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return Response.json({ ok: false, error: "LOVABLE_API_KEY not configured" }, { status: 500, headers: corsHeaders });
  }
  const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
  if (!SLACK_API_KEY) {
    return Response.json({ ok: false, error: "SLACK_API_KEY not configured" }, { status: 500, headers: corsHeaders });
  }

  try {
    // Step 1: Find #leads channel ID by listing channels
    const listRes = await fetch(`${GATEWAY_URL}/conversations.list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ types: "public_channel,private_channel", limit: 200 }),
    });
    const listData = await listRes.json();
    console.log("conversations.list ok:", listData.ok, "error:", listData.error, "count:", (listData.channels ?? []).length);
    
    const found = (listData.channels ?? []).find((c: any) => c.name === "leads");
    if (!found) {
      return Response.json({ ok: false, error: "Canal #leads no encontrado en el workspace" }, { status: 404, headers: corsHeaders });
    }
    const channelId = found.id;
    console.log("Found #leads channel ID:", channelId);

    // Step 2: Join the channel (idempotent, best-effort)
    try {
      const joinRes = await fetch(`${GATEWAY_URL}/conversations.join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": SLACK_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: channelId }),
      });
      const joinText = await joinRes.text();
      console.log("conversations.join status:", joinRes.status, "body:", joinText);
    } catch (joinErr) {
      console.warn("conversations.join failed (continuing):", joinErr);
    }

    const { data: rows } = await supabase
      .from("advisor_notifications")
      .select("*")
      .eq("status", "pending")
      .lte("send_after", new Date().toISOString())
      .limit(20);

    let sent = 0;
    let failed = 0;

    for (const n of rows ?? []) {
      try {
        const payload = (n.payload ?? {}) as Record<string, unknown>;

        const res = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": SLACK_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: channelId,
            username: "Visualia CRM",
            icon_url: "https://signa-pulse-network.lovable.app/favicon.png",
            text: `🔔 Nuevo lead: ${payload.name ?? "Sin nombre"} — ${payload.company ?? ""}`,
            blocks: buildSlackBlocks(payload),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(`Slack API error [${res.status}]: ${JSON.stringify(data)}`);
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
