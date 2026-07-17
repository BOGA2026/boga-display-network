// Platform admin overview: aggregated stats + businesses list
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, service);
    const { data: isAdminRow } = await admin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userRes.user.id)
      .maybeSingle();
    if (!isAdminRow) return json({ error: "Forbidden" }, 403);

    // Parallel aggregate queries
    const [
      businessesRes,
      screensRes,
      screensOnlineRes,
      locationsRes,
      contentRes,
      leadsRes,
      leadsNewRes,
      paymentsRes,
      subsRes,
      businessesListRes,
    ] = await Promise.all([
      admin.from("businesses").select("*", { count: "exact", head: true }),
      admin.from("screens").select("*", { count: "exact", head: true }),
      admin.from("screens").select("*", { count: "exact", head: true }).eq("status", "online"),
      admin.from("locations").select("*", { count: "exact", head: true }),
      admin.from("content").select("*", { count: "exact", head: true }),
      admin.from("leads").select("*", { count: "exact", head: true }),
      admin.from("leads").select("*", { count: "exact", head: true }).eq("status", "nuevo"),
      admin.from("payments").select("amount, status, created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(500),
      admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      admin.from("businesses").select("id, name, created_at").order("created_at", { ascending: false }).limit(50),
    ]);

    const businesses = businessesListRes.data ?? [];
    // Enrich each business with screen count
    const businessIds = businesses.map((b: any) => b.id);
    let screensByBiz: Record<string, number> = {};
    let membersByBiz: Record<string, number> = {};
    if (businessIds.length) {
      const { data: sc } = await admin.from("screens").select("business_id").in("business_id", businessIds);
      (sc ?? []).forEach((r: any) => {
        screensByBiz[r.business_id] = (screensByBiz[r.business_id] ?? 0) + 1;
      });
      const { data: mb } = await admin.from("business_memberships").select("business_id").in("business_id", businessIds);
      (mb ?? []).forEach((r: any) => {
        membersByBiz[r.business_id] = (membersByBiz[r.business_id] ?? 0) + 1;
      });
    }

    const payments = paymentsRes.data ?? [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenueTotal = payments.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
    const revenueMonth = payments
      .filter((p: any) => new Date(p.created_at) >= monthStart)
      .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

    return json({
      stats: {
        businesses: businessesRes.count ?? 0,
        screens: screensRes.count ?? 0,
        screensOnline: screensOnlineRes.count ?? 0,
        locations: locationsRes.count ?? 0,
        content: contentRes.count ?? 0,
        leads: leadsRes.count ?? 0,
        leadsNew: leadsNewRes.count ?? 0,
        activeSubscriptions: subsRes.count ?? 0,
        revenueTotal,
        revenueMonth,
        paymentsCount: payments.length,
      },
      businesses: businesses.map((b: any) => ({
        ...b,
        screenCount: screensByBiz[b.id] ?? 0,
        memberCount: membersByBiz[b.id] ?? 0,
      })),
    });
  } catch (e) {
    console.error("admin-overview error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
