import { supabase } from "@/integrations/supabase/client";
import type { TemplateDocument, TemplateRow } from "./types";

export interface TemplateFilters {
  businessType?: string;
  pieceType?: string;
  orientation?: string;
  soloActivas?: boolean;
}

export async function listTemplates(f: TemplateFilters = {}): Promise<TemplateRow[]> {
  let q = supabase
    .from("templates")
    .select("id, name, business_type, piece_type, orientation, background_url, thumbnail_url, document, is_active, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (f.soloActivas !== false) q = q.eq("is_active", true);
  if (f.businessType && f.businessType !== "todos") q = q.in("business_type", [f.businessType, "general"]);
  if (f.pieceType && f.pieceType !== "todos") q = q.eq("piece_type", f.pieceType);
  if (f.orientation && f.orientation !== "todas") q = q.eq("orientation", f.orientation);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as TemplateRow[];
}

export async function fetchTemplate(id: string): Promise<TemplateRow | null> {
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, business_type, piece_type, orientation, background_url, thumbnail_url, document, is_active, sort_order, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as TemplateRow) ?? null;
}

export interface TemplateInput {
  id?: string;
  name: string;
  business_type: string;
  piece_type: string;
  orientation: string;
  background_url: string;
  thumbnail_url: string;
  document: TemplateDocument;
  is_active?: boolean;
  sort_order?: number;
}

export async function saveTemplate(input: TemplateInput) {
  const row = { ...input, document: input.document as unknown as never };
  if (input.id) {
    const { error } = await supabase.from("templates").update(row).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }
  const { data, error } = await supabase.from("templates").insert(row).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function setTemplateActive(id: string, active: boolean) {
  const { error } = await supabase.from("templates").update({ is_active: active }).eq("id", id);
  if (error) throw error;
}

/** Sube un fondo o miniatura de plantilla al bucket público de medios. */
export async function uploadTemplateAsset(file: Blob, nombre: string): Promise<string> {
  const path = `plantillas/${crypto.randomUUID()}-${nombre}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** ¿El usuario puede administrar plantillas? Solo el equipo de Visualia. */
export async function isPlatformAdmin(): Promise<boolean> {
  const { data } = await supabase.rpc("is_platform_admin");
  return Boolean(data);
}
