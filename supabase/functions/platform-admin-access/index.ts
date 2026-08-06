import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ACTIONS = new Set(["invite", "cancel", "activate", "revoke"]);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const RPC_BY_ACTION: Record<string, string> = {
  invite: "invite_platform_admin",
  cancel: "cancel_platform_admin_invite",
  activate: "activate_platform_admin",
  revoke: "revoke_platform_admin",
};

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip");
}

async function notifyAdmins(params: {
  targetEmail: string;
  actorEmail: string;
  ip: string | null;
  when: string;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.warn("RESEND_API_KEY/LOVABLE_API_KEY ausentes: no se enviaron correos de aviso");
    return { sent: 0, reason: "email_not_configured" };
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: rows } = await admin.from("platform_admins").select("user_id");
  const recipients: string[] = [];
  for (const r of rows ?? []) {
    const { data } = await admin.auth.admin.getUserById(r.user_id as string);
    if (data?.user?.email) recipients.push(data.user.email);
  }
  if (recipients.length === 0) return { sent: 0, reason: "no_recipients" };

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px">Se activó un nuevo administrador de plataforma</h2>
      <p><strong>${params.targetEmail}</strong> ahora tiene acceso total a Visualia:
      todos los negocios y los datos de todos los clientes.</p>
      <ul>
        <li>Autorizado por: ${params.actorEmail}</li>
        <li>Fecha: ${params.when}</li>
        <li>Dirección IP: ${params.ip ?? "desconocida"}</li>
      </ul>
      <p>Si no reconoces este cambio, revísalo de inmediato en el panel
      (Administradores) y revoca el acceso.</p>
    </div>`;

  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "Visualia <seguridad@visualiamedia.com>",
      to: recipients,
      subject: `Nuevo administrador de plataforma: ${params.targetEmail}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend falló [${res.status}]: ${body}`);
    return { sent: 0, reason: `email_error_${res.status}` };
  }
  return { sent: recipients.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!ACTIONS.has(action)) return json({ error: "Acción inválida" }, 400);
    if (!EMAIL_RE.test(email) || email.length > 255) return json({ error: "Correo inválido" }, 400);

    const ip = clientIp(req);
    const userAgent = req.headers.get("user-agent")?.slice(0, 400) ?? null;

    // The RPCs are SECURITY DEFINER and verify the caller is a platform admin.
    const { data, error } = await supabase.rpc(RPC_BY_ACTION[action], {
      _email: email,
      _ip: ip,
      _user_agent: userAgent,
    });
    if (error) {
      console.error(`${action} falló para ${email}: ${error.message}`);
      return json({ error: error.message }, 400);
    }

    let notification: unknown = null;
    if (action === "activate") {
      notification = await notifyAdmins({
        targetEmail: email,
        actorEmail: String(claimsData.claims.email ?? "desconocido"),
        ip,
        when: new Date().toISOString(),
      });
    }

    return json({ ok: true, result: data, notification });
  } catch (e) {
    console.error("platform-admin-access error", e);
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
