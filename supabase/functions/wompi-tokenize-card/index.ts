// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY")!;
const WOMPI_PRIVATE_KEY = Deno.env.get("WOMPI_PRIVATE_KEY")!;

// Detect environment from key prefix
const IS_SANDBOX = WOMPI_PUBLIC_KEY.startsWith("pub_test_");
const WOMPI_API_BASE = IS_SANDBOX
  ? "https://sandbox.wompi.co/v1"
  : "https://production.wompi.co/v1";

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
      number,
      exp_month,
      exp_year,
      cvc,
      card_holder,
      customer_email,
    } = body ?? {};

    if (!business_id || !number || !exp_month || !exp_year || !cvc || !card_holder || !customer_email) {
      return new Response(
        JSON.stringify({ error: "Todos los campos de la tarjeta son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user can manage this business
    const { data: canManage } = await supabase.rpc("can_manage_business", { _business_id: business_id });
    if (!canManage) {
      return new Response(JSON.stringify({ error: "No autorizado para este negocio" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Get merchant info + acceptance tokens
    const merchantRes = await fetch(`${WOMPI_API_BASE}/merchants/${WOMPI_PUBLIC_KEY}`, {
      headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` },
    });
    if (!merchantRes.ok) {
      const errText = await merchantRes.text();
      console.error("Wompi merchant error:", errText);
      return new Response(JSON.stringify({ error: "Error al obtener datos del comercio Wompi" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const merchantData = await merchantRes.json();
    const acceptanceToken = merchantData?.data?.presigned_acceptance?.acceptance_token;
    const personalAuthToken = merchantData?.data?.presigned_personal_data_auth?.acceptance_token;

    if (!acceptanceToken || !personalAuthToken) {
      return new Response(JSON.stringify({ error: "No se pudieron obtener los tokens de aceptación" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Tokenize card with public key
    const tokenizeRes = await fetch(`${WOMPI_API_BASE}/tokens/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
      },
      body: JSON.stringify({
        number: String(number).replace(/\s/g, ""),
        exp_month: String(exp_month).padStart(2, "0"),
        exp_year: String(exp_year).slice(-2),
        cvc: String(cvc),
        card_holder: String(card_holder).trim(),
      }),
    });

    if (!tokenizeRes.ok) {
      const errData = await tokenizeRes.json().catch(() => ({}));
      console.error("Wompi tokenize error:", errData);
      return new Response(
        JSON.stringify({ error: errData?.error?.reason ?? "Error al tokenizar la tarjeta" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenizeData = await tokenizeRes.json();
    const cardToken = tokenizeData?.data?.id;
    if (!cardToken) {
      return new Response(JSON.stringify({ error: "No se recibió token de tarjeta" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Create payment source with private key
    const sourceRes = await fetch(`${WOMPI_API_BASE}/payment_sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        type: "CARD",
        token: cardToken,
        customer_email: customer_email,
        acceptance_token: acceptanceToken,
        accept_personal_auth: personalAuthToken,
      }),
    });

    if (!sourceRes.ok) {
      const errData = await sourceRes.json().catch(() => ({}));
      console.error("Wompi payment source error:", errData);
      return new Response(
        JSON.stringify({ error: errData?.error?.reason ?? "Error al registrar la fuente de pago" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourceData = await sourceRes.json();
    const paymentSource = sourceData?.data;
    if (!paymentSource || paymentSource.status !== "AVAILABLE") {
      return new Response(JSON.stringify({ error: "La fuente de pago no está disponible" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 4: Save to DB
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingMethods } = await admin
      .from("payment_methods")
      .select("id")
      .eq("business_id", business_id);

    const isFirst = (existingMethods?.length ?? 0) === 0;

    const { data: newMethod, error: dbErr } = await admin
      .from("payment_methods")
      .insert({
        business_id,
        brand: tokenizeData?.data?.brand ?? "CARD",
        last4: tokenizeData?.data?.last_four ?? "0000",
        exp_month: parseInt(tokenizeData?.data?.exp_month ?? "0", 10),
        exp_year: parseInt(tokenizeData?.data?.exp_year ?? "0", 10),
        is_default: isFirst,
        provider: "wompi",
        provider_ref: String(paymentSource.id),
        token: cardToken,
        customer_email: customer_email,
      })
      .select()
      .single();

    if (dbErr) {
      console.error("DB insert error:", dbErr);
      return new Response(
        JSON.stringify({ error: "Error al guardar el método de pago", details: dbErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        payment_method: newMethod,
        brand: tokenizeData?.data?.brand,
        last4: tokenizeData?.data?.last_four,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("wompi-tokenize-card error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
