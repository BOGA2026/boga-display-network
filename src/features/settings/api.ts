/**
 * Ajustes del negocio — lectura y escritura.
 *
 * El uso real (almacenamiento y pantallas) sale de la RPC `business_usage`,
 * que suma `content.file_size_bytes` del negocio. No hay estimaciones.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/query-client";
import { tenantQueryKey, getTenant } from "@/features/auth/tenant";
import { STORAGE_LIMIT_BYTES } from "@/config/businessSettings";

export interface BusinessUsage {
  usedBytes: number;
  contentCount: number;
  screensUsed: number;
  screensLicensed: number;
  limitBytes: number;
  ratio: number;
}

export const usageQueryKey = (businessId?: string | null) =>
  ["business-usage", businessId ?? null] as const;

export async function fetchBusinessUsage(businessId: string): Promise<BusinessUsage> {
  const { data, error } = await supabase.rpc("business_usage", { p_business_id: businessId });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  const usedBytes = Number(row?.used_bytes ?? 0);
  return {
    usedBytes,
    contentCount: Number(row?.content_count ?? 0),
    screensUsed: Number(row?.screens_used ?? 0),
    screensLicensed: Number(row?.screens_licensed ?? 0),
    limitBytes: STORAGE_LIMIT_BYTES,
    ratio: STORAGE_LIMIT_BYTES > 0 ? usedBytes / STORAGE_LIMIT_BYTES : 0,
  };
}

export function useBusinessUsage(businessId?: string | null) {
  return useQuery({
    queryKey: usageQueryKey(businessId),
    queryFn: () => fetchBusinessUsage(businessId as string),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

/** ¿Hay cupo para subir `bytes`? Consulta el uso real, sin caché vieja. */
export async function hasStorageRoom(bytes: number): Promise<{ ok: boolean; usage: BusinessUsage | null }> {
  const { businessId } = await getTenant();
  if (!businessId) return { ok: true, usage: null };
  const usage = await queryClient.fetchQuery({
    queryKey: usageQueryKey(businessId),
    queryFn: () => fetchBusinessUsage(businessId),
  });
  return { ok: usage.usedBytes + bytes <= usage.limitBytes, usage };
}

export interface BusinessSettingsPatch {
  name?: string;
  category?: string | null;
  city?: string | null;
  timezone?: string;
  logo_url?: string | null;
  default_duration_seconds?: number;
  default_expiry_days?: number | null;
}

/**
 * Guardado automático campo por campo. Invalida la caché del tenant para que
 * el resto del panel (zona horaria incluida) lea el valor nuevo.
 */
export function useSaveBusinessSettings(businessId?: string | null, userId?: string | null) {
  return useMutation({
    mutationFn: async (patch: BusinessSettingsPatch) => {
      if (!businessId) throw new Error("Sin negocio asociado");
      const { error } = await supabase.from("businesses").update(patch).eq("id", businessId);
      if (error) throw error;
      // El logo alimenta el brand kit usado por la generación de menús con IA.
      if (patch.logo_url !== undefined) {
        await supabase
          .from("brand_kits")
          .upsert({ business_id: businessId, logo_url: patch.logo_url }, { onConflict: "business_id" });
      }
      return patch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKey(userId) });
    },
  });
}

/** Sube el logo al bucket público y devuelve su URL. */
export async function uploadBusinessLogo(businessId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${businessId}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
