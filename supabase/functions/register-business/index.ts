import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, business_name } = await req.json();

    if (!user_id || !business_name?.trim()) {
      return new Response(JSON.stringify({ error: "Missing user_id or business_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = business_name.trim();

    // 1. Create business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({ name })
      .select("id")
      .single();

    if (bizError) throw bizError;

    // 2. Create membership (admin)
    const { error: memError } = await supabase
      .from("business_memberships")
      .insert({ business_id: business.id, user_id, role: "admin" });

    if (memError) throw memError;

    // 3. Update profile with business_id
    const { error: profError } = await supabase
      .from("profiles")
      .update({ business_id: business.id, full_name: name })
      .eq("id", user_id);

    if (profError) console.warn("Profile update warning:", profError.message);

    return new Response(JSON.stringify({ business_id: business.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Register error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
