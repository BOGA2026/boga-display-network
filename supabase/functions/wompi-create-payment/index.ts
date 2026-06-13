// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY")!;
const WOMPI_INTEGRITY_SECRET = Deno.env.get("WOMPI_INTEGRITY_SECRET")!;

// Detect environment from key prefix (pub_test_ vs pub_prod_)
const IS_SANDBOX = WOMPI_PUBLIC_KEY.startsWith("pub_test_");

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const body = await req.json();
    const {
      business_id,
      amount_cop, // in pesos (we convert to cents)
      description,
      payment_type = "one_time", // 'one_time' | 'subscription_setup'
      target_screen_count, // optional, for subscription changes
      proration_breakdown, // optional metadata
      customer_email,
    } = body ?? {};

    if (!business_id || !amount_cop || amount_cop <= 0) {
      return new Response(JSON.stringify({ error: "business_id y amount_cop > 0 requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user can manage this business
    const { data: canManage } = await supabase.rpc("can_manage_business", { _business_id: business_id });
    if (!canManage) {
      return new Response(JSON.stringify({ error: "No autorizado para este negocio" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for writes
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const reference = `VIS-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();
    const amountInCents = Math.round(Number(amount_cop) * 100);

    // Get user email for customer-data if not provided
    let email = customer_email;
    if (!email) {
      const { data: userData } = await supabase.auth.getUser(token);
      email = userData?.user?.email ?? undefined;
    }

    // Get or create a pending subscription (invoices.subscription_id is NOT NULL)
    let { data: sub } = await admin
      .from("subscriptions")
      .select("id, screens_count")
      .eq("business_id", business_id)
      .maybeSingle();

    if (!sub) {
      const initialCount = target_screen_count ?? 1;
      const { data: newSub, error: subErr } = await admin
        .from("subscriptions")
        .insert({
          business_id,
          plan: "visualia",
          screens_count: initialCount,
          billing_cycle: "monthly",
          price_per_screen: 0, // will be recomputed
          total_amount: amount_cop,
          status: "pending",
          next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        })
        .select("id, screens_count")
        .single();
      if (subErr) {
        console.error("Subscription insert error:", subErr);
        return new Response(JSON.stringify({ error: "No se pudo crear suscripción", details: subErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sub = newSub;
    }

    // Create pending invoice
    const invoiceNumber = `INV-${reference}`;
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .insert({
        subscription_id: sub.id,
        business_id,
        invoice_number: invoiceNumber,
        subtotal: amount_cop,
        tax: 0,
        total: amount_cop,
        currency: "COP",
        status: "pending",
        due_date: new Date().toISOString().slice(0, 10),
        notes: description ?? null,
      })
      .select()
      .single();

    if (invErr) {
      console.error("Invoice insert error:", invErr);
      return new Response(JSON.stringify({ error: "No se pudo crear factura", details: invErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create pending payment
    const { error: payErr } = await admin.from("payments").insert({
      subscription_id: sub?.id ?? null,
      business_id,
      amount: amount_cop,
      status: "pending",
      invoice_number: invoiceNumber,
      billing_email: email,
      provider: "wompi",
      external_reference: reference,
      invoice_id: invoice.id,
      payment_type,
      metadata: {
        target_screen_count: target_screen_count ?? null,
        proration_breakdown: proration_breakdown ?? null,
        user_id: userId,
      },
    });

    if (payErr) {
      console.error("Payment insert error:", payErr);
      return new Response(JSON.stringify({ error: "No se pudo crear pago", details: payErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Wompi Checkout Web URL with integrity signature
    // signature = sha256(reference + amountInCents + currency + integritySecret)
    const currency = "COP";
    const signature = await sha256Hex(`${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`);

    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const redirectUrl = `${origin}/dashboard/suscripcion?wompi_ref=${reference}`;

    const checkoutBase = "https://checkout.wompi.co/p/";
    const params = new URLSearchParams({
      "public-key": WOMPI_PUBLIC_KEY,
      "currency": currency,
      "amount-in-cents": String(amountInCents),
      "reference": reference,
      "signature:integrity": signature,
      "redirect-url": redirectUrl,
    });
    if (email) params.set("customer-data:email", email);

    const checkoutUrl = `${checkoutBase}?${params.toString()}`;

    // Save checkout URL
    await admin
      .from("payments")
      .update({ checkout_url: checkoutUrl })
      .eq("external_reference", reference);

    return new Response(
      JSON.stringify({
        ok: true,
        checkout_url: checkoutUrl,
        reference,
        amount_in_cents: amountInCents,
        environment: IS_SANDBOX ? "sandbox" : "production",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("wompi-create-payment error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
