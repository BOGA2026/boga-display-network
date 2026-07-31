import { supabase } from "@/integrations/supabase/client";

export type QRCode = {
  id: string;
  business_id: string;
  screen_id: string | null;
  label: string;
  target_url: string;
  slug: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type QRScan = {
  id: string;
  qr_code_id: string;
  scanned_at: string;
  device_type: "mobile" | "tablet" | "desktop" | "unknown" | null;
  country: string | null;
  city: string | null;
  screen_id: string | null;
  user_agent: string | null;
  referrer: string | null;
};

const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export function shortUrlFor(slug: string, fromScreen?: string | null) {
  const base = `${FUNCTIONS_BASE}/qr-redirect?slug=${encodeURIComponent(slug)}`;
  return fromScreen ? `${base}&from=${encodeURIComponent(fromScreen)}` : base;
}

/** Slug generator: 6 chars, alphanum, avoids visually confusing pairs. */
export function generateSlug(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const buf = crypto.getRandomValues(new Uint8Array(6));
  for (const b of buf) out += alphabet[b % alphabet.length];
  return out;
}

export async function listQRCodes(businessId: string): Promise<QRCode[]> {
  const { data, error } = await supabase
    .from("qr_codes")
    .select("id, business_id, screen_id, label, target_url, slug, active, created_at, updated_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as QRCode[];
}

export async function createQRCode(input: {
  business_id: string;
  label: string;
  target_url: string;
  screen_id?: string | null;
}): Promise<QRCode> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({ ...input, slug, active: true })
      .select()
      .single();
    if (!error) return data as QRCode;
    // 23505 = unique violation → collide on slug, retry
    if ((error as { code?: string }).code !== "23505") throw error;
  }
  throw new Error("No se pudo generar un slug único, intentá de nuevo.");
}

export async function updateQRCode(id: string, patch: Partial<Pick<QRCode, "label" | "target_url" | "active" | "screen_id">>) {
  const { error } = await supabase.from("qr_codes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteQRCode(id: string) {
  const { error } = await supabase.from("qr_codes").delete().eq("id", id);
  if (error) throw error;
}

export async function listScans(qrId: string, sinceDays = 30): Promise<QRScan[]> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const { data, error } = await supabase
    .from("qr_scans")
    .select("id, qr_code_id, scanned_at, device_type, country, city, screen_id, user_agent, referrer")
    .eq("qr_code_id", qrId)
    .gte("scanned_at", since.toISOString())
    .order("scanned_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as QRScan[];
}
