/**
 * "Tu marca" — fuente única de colores, tipografías y logos del negocio.
 *
 * De acá leen el generador de menús con IA y el editor. No es un álbum de
 * archivos: si un dato no alimenta a esos dos, no vive en esta sección.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/query-client";
import { getBusinessId, getUserId } from "@/features/auth/tenant";
import { DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT } from "./fonts";

export interface BrandKit {
  business_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  background_color: string;
  text_color: string;
  extra_color: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  logo_light_url: string | null;
  logo_symbol_url: string | null;
  heading_font: string | null;
  body_font: string | null;
}

export type LogoSlot = "logo_url" | "logo_dark_url" | "logo_light_url" | "logo_symbol_url";

export const LOGO_SLOTS: { key: LogoSlot; label: string; hint: string }[] = [
  { key: "logo_url", label: "Principal", hint: "Tu logo a color, como lo usas siempre." },
  { key: "logo_dark_url", label: "Para fondos oscuros", hint: "Versión clara del logo." },
  { key: "logo_light_url", label: "Para fondos claros", hint: "Versión oscura del logo." },
  { key: "logo_symbol_url", label: "Símbolo solo", hint: "Sin el nombre, solo el ícono." },
];

export const BRAND_COLOR_FIELDS = [
  { key: "primary_color", label: "Primario", hint: "El color con el que te reconocen." },
  { key: "secondary_color", label: "Secundario", hint: "Acompaña al primario." },
  { key: "accent_color", label: "Acento", hint: "Para precios y botones." },
  { key: "background_color", label: "Fondo", hint: "Base de la pantalla." },
  { key: "text_color", label: "Texto", hint: "Sobre el fondo de arriba." },
  { key: "extra_color", label: "Libre", hint: "Un color extra que uses a veces." },
] as const;

export type BrandColorKey = (typeof BRAND_COLOR_FIELDS)[number]["key"];

export const DEFAULT_BRAND: Omit<BrandKit, "business_id"> = {
  primary_color: "#7C3AED",
  secondary_color: "#EC4899",
  accent_color: "#F59E0B",
  background_color: "#0B0B0F",
  text_color: "#FFFFFF",
  extra_color: null,
  logo_url: null,
  logo_dark_url: null,
  logo_light_url: null,
  logo_symbol_url: null,
  heading_font: DEFAULT_HEADING_FONT,
  body_font: DEFAULT_BODY_FONT,
};

export const brandKitQueryKey = (businessId?: string | null) =>
  ["brand-kit", businessId ?? null] as const;

const SELECT =
  "business_id, primary_color, secondary_color, accent_color, background_color, text_color, extra_color, logo_url, logo_dark_url, logo_light_url, logo_symbol_url, heading_font, body_font";

export async function fetchBrandKit(): Promise<BrandKit | null> {
  const businessId = await getBusinessId();
  if (!businessId) return null;
  const { data, error } = await supabase
    .from("brand_kits")
    .select(SELECT)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { business_id: businessId, ...DEFAULT_BRAND };
  return {
    ...DEFAULT_BRAND,
    ...(data as unknown as BrandKit),
    business_id: businessId,
  };
}

export function useBrandKit() {
  return useQuery({
    queryKey: ["brand-kit", "current"],
    queryFn: fetchBrandKit,
    staleTime: 5 * 60_000,
  });
}

/** El logo del negocio existe también en Ajustes; se mantiene sincronizado. */
export function useSaveBrandKit() {
  return useMutation({
    mutationFn: async (patch: Partial<Omit<BrandKit, "business_id">>) => {
      const businessId = await getBusinessId();
      if (!businessId) throw new Error("Sin negocio asociado");
      const { error } = await supabase
        .from("brand_kits")
        .upsert({ business_id: businessId, ...patch }, { onConflict: "business_id" });
      if (error) throw error;
      if (patch.logo_url !== undefined) {
        await supabase.from("businesses").update({ logo_url: patch.logo_url }).eq("id", businessId);
      }
      return patch;
    },
    onSuccess: (patch) => {
      queryClient.setQueryData<BrandKit | null>(["brand-kit", "current"], (prev) =>
        prev ? { ...prev, ...patch } : prev,
      );
      queryClient.invalidateQueries({ queryKey: ["generate-ai", "menu-data"] });
    },
  });
}

/** Sube un archivo de marca al bucket del negocio y devuelve su URL pública. */
export async function uploadBrandFile(file: File, carpeta: "logos" | "fotos"): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Tu sesión se cerró. Vuelve a entrar e inténtalo de nuevo.");
  const businessId = await getBusinessId();
  if (!businessId) throw new Error("Sin negocio asociado");
  const safe = file.name.replace(/[^\w.-]/g, "_");
  // La carpeta raíz es el id del negocio: es lo que valida la política del bucket.
  const path = `${businessId}/marca/${carpeta}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/* ─────────────── Fotos del negocio ─────────────── */

export interface BrandPhoto {
  id: string;
  name: string;
  url: string;
  tag: string | null;
  created_at: string;
}

export function useBrandPhotos() {
  return useQuery({
    queryKey: ["brand-photos"],
    queryFn: async (): Promise<BrandPhoto[]> => {
      const businessId = await getBusinessId();
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("brand_photos")
        .select("id, name, url, tag, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrandPhoto[];
    },
    staleTime: 60_000,
  });
}

export function useAddBrandPhoto() {
  return useMutation({
    mutationFn: async (file: File) => {
      const businessId = await getBusinessId();
      if (!businessId) throw new Error("Sin negocio asociado");
      const url = await uploadBrandFile(file, "fotos");
      const { error } = await supabase.from("brand_photos").insert({
        business_id: businessId,
        name: file.name.replace(/\.[^.]+$/, ""),
        url,
        created_by: await getUserId(),
      });
      if (error) throw error;
      return url;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brand-photos"] }),
  });
}

export function useDeleteBrandPhoto() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brand_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brand-photos"] }),
  });
}

/* ─────────────── Plantillas de la marca ─────────────── */

export interface BrandTemplate {
  id: string;
  name: string;
  thumbnail_url: string | null;
  created_at: string;
}

/**
 * Las plantillas son diseños guardados desde el editor (`content.type = preset`).
 * Guardan la estructura, no el contenido: al abrirlas se les aplica la marca y
 * los platos actuales del menú.
 */
export function useBrandTemplates() {
  return useQuery({
    queryKey: ["brand-templates"],
    queryFn: async (): Promise<BrandTemplate[]> => {
      const businessId = await getBusinessId();
      if (!businessId) return [];
      const { data, error } = await supabase
        .from("content")
        .select("id, name, thumbnail_url, created_at")
        .eq("business_id", businessId)
        .eq("type", "preset")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrandTemplate[];
    },
    staleTime: 60_000,
  });
}

/** Cuántos diseños existen hoy (para avisar cuando cambian los colores). */
export async function countDesigns(): Promise<number> {
  const businessId = await getBusinessId();
  if (!businessId) return 0;
  const { count } = await supabase
    .from("content")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .in("type", ["layout", "menu", "image"]);
  return count ?? 0;
}
