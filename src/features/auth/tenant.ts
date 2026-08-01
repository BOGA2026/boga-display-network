/**
 * Tenant — resolución única y cacheada del negocio del usuario.
 *
 * Decisión de producto: un usuario pertenece a UN solo negocio.
 *
 * Antes había tres mecanismos resolviendo lo mismo sin caché
 * (rpc get_user_business_id, profiles.business_id y business_memberships),
 * y cada navegación repetía el viaje. Ahora hay una sola consulta
 * (`get_tenant()`, security invoker) cacheada para siempre bajo
 * ['tenant', userId].
 *
 * - En componentes: `useTenant()`.
 * - En código imperativo (handlers, mutaciones): `getBusinessId()` /
 *   `getTenant()`, que leen de la misma caché y no vuelven a la red.
 */
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/query-client";
import { DEFAULT_TIMEZONE } from "@/lib/businessTime";

export type TenantRole = "owner" | "admin" | "manager" | "content_editor" | "viewer";

export interface Tenant {
  userId: string | null;
  businessId: string | null;
  businessName: string | null;
  /** Zona horaria IANA del negocio. Las horas de programación son locales a esta zona. */
  timezone: string;
  role: TenantRole | null;
}

export const EMPTY_TENANT: Tenant = {
  userId: null,
  businessId: null,
  businessName: null,
  timezone: DEFAULT_TIMEZONE,
  role: null,
};

export const tenantQueryKey = (userId?: string | null) => ["tenant", userId ?? null] as const;

export async function fetchTenant(): Promise<Tenant> {
  const { data, error } = await supabase.rpc("get_tenant");
  if (error) throw error;
  const t = (data ?? {}) as Record<string, unknown>;
  return {
    userId: (t.user_id as string) ?? null,
    businessId: (t.business_id as string) ?? null,
    businessName: (t.business_name as string) ?? null,
    timezone: (t.timezone as string) || DEFAULT_TIMEZONE,
    role: (t.role as TenantRole) ?? null,
  };
}

/** Opciones compartidas por el provider y por la resolución imperativa. */
export const tenantQueryOptions = (userId?: string | null) => ({
  queryKey: tenantQueryKey(userId),
  queryFn: fetchTenant,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
});

/**
 * Resolución imperativa del tenant. Usa getSession() (memoria, sin red) para
 * el userId y reutiliza la caché de react-query para el resto.
 */
export async function getTenant(): Promise<Tenant> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;
  if (!userId) return EMPTY_TENANT;
  return queryClient.ensureQueryData(tenantQueryOptions(userId));
}

export async function getBusinessId(): Promise<string | null> {
  return (await getTenant()).businessId;
}

/** id del usuario sin viaje de red. */
export async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}
