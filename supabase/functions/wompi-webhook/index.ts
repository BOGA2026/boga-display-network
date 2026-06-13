// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WOMPI_EVENTS_SECRET = Deno.env.get("WOMPI_EVENTS_SECRET")!;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify HMAC signature per Wompi spec:
  // checksum = sha256( concat(values_of_properties) + timestamp + events_secret )
  const sig = payload?.signature;
  const timestamp = payload?.timestamp;
  if (!sig?.properties || !sig?.checksum || !timestamp) {
    console.warn("Missing signature fields");
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const concatenated = sig.properties
    .map((p: string) => String(getByPath(payload.data, p) ?? ""))
    .join("");
  const expected = await sha256Hex(`${concatenated}${timestamp}${WOMPI_EVENTS_SECRET}`);

  if (expected !== sig.checksum) {
    console.error("Signature mismatch", { expected, got: sig.checksum });
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Only process transaction events
  const event = payload?.event;
  const tx = payload?.data?.transaction;
  if (event !== "transaction.updated" || !tx) {
    console.log("Ignoring event:", event);
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const reference = tx.reference;
  const status = tx.status; // APPROVED | DECLINED | VOIDED | ERROR | PENDING

  // Find our payment
  const { data: payment, error: payErr } = await admin
    .from("payments")
    .select("*")
    .eq("external_reference", reference)
    .maybeSingle();

  if (payErr || !payment) {
    console.error("Payment not found for ref:", reference);
    // Respond 200 so Wompi doesn't retry forever; log it
    return new Response(JSON.stringify({ ok: true, unknown_ref: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (payment.status === "paid" && status === "APPROVED") {
    return new Response(JSON.stringify({ ok: true, already_paid: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Map Wompi status to ours
  const mappedStatus =
    status === "APPROVED" ? "paid" :
    status === "DECLINED" ? "failed" :
    status === "VOIDED" ? "voided" :
    status === "ERROR" ? "failed" : "pending";

  // Update payment
  await admin
    .from("payments")
    .update({
      status: mappedStatus,
      provider_ref: tx.id,
      payment_method: tx.payment_method_type ?? null,
    })
    .eq("id", payment.id);

  // Update invoice
  if (payment.invoice_id) {
    await admin
      .from("invoices")
      .update({
        status: mappedStatus === "paid" ? "paid" : (mappedStatus === "pending" ? "pending" : "failed"),
        paid_at: mappedStatus === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", payment.invoice_id);
  }

  // On APPROVED: apply subscription change and activate screens
  if (status === "APPROVED") {
    const meta = payment.metadata ?? {};
    const targetCount: number | null = meta.target_screen_count ?? null;

    if (targetCount != null) {
      // Compute new total via stored proration formula on server isn't trivial without sharing code;
      // we trust the breakdown sent and use simple rule: amount=payment.amount for the next cycle if it's a setup,
      // otherwise we just update screens_count and let the next billing job recompute totals.
      // For now: update screens_count; let the existing UI recompute on next render.
      const { data: sub } = await admin
        .from("subscriptions")
        .select("id")
        .eq("business_id", payment.business_id)
        .maybeSingle();

      if (sub) {
        await admin
          .from("subscriptions")
          .update({
            screens_count: targetCount,
            status: "active",
          })
          .eq("id", sub.id);
      }

      // Activate all screens for this business
      await admin
        .from("screens")
        .update({ license_status: "active" })
        .eq("business_id", payment.business_id);
    }

    // Save payment source if Wompi included one (for future recurring charges)
    const paymentSourceId = tx.payment_source_id ?? null;
    const cardInfo = tx.payment_method?.extra;
    if (paymentSourceId && cardInfo) {
      const { data: existing } = await admin
        .from("payment_methods")
        .select("id")
        .eq("business_id", payment.business_id)
        .eq("token", String(paymentSourceId))
        .maybeSingle();

      if (!existing) {
        await admin.from("payment_methods").insert({
          business_id: payment.business_id,
          provider: "wompi",
          provider_ref: String(paymentSourceId),
          token: String(paymentSourceId),
          brand: cardInfo.brand ?? "card",
          last4: cardInfo.last_four ?? "0000",
          exp_month: Number(cardInfo.exp_month ?? 1),
          exp_year: Number(`20${cardInfo.exp_year ?? "30"}`),
          is_default: true,
          customer_email: tx.customer_email ?? null,
        });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, status: mappedStatus }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
