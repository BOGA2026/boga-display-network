import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/context/AuthContext";
import {
  EMPTY_TENANT,
  tenantQueryOptions,
  type Tenant,
  type TenantRole,
} from "./tenant";

export type { TenantRole, Tenant };

/**
 * Negocio del usuario autenticado. Una sola consulta, cacheada para siempre.
 * No hay selector de negocio: un usuario pertenece a un solo negocio.
 */
export function useTenant() {
  const { userId, loading: authLoading } = useAuthContext();

  const { data, isLoading } = useQuery({
    ...tenantQueryOptions(userId),
    enabled: !!userId,
  });

  const tenant: Tenant = data ?? EMPTY_TENANT;

  const hasRole = useCallback(
    (roles: TenantRole | TenantRole[]) => {
      if (!tenant.role) return false;
      const list = Array.isArray(roles) ? roles : [roles];
      return list.includes(tenant.role);
    },
    [tenant.role],
  );

  return {
    businessId: tenant.businessId,
    businessName: tenant.businessName,
    role: tenant.role,
    loading: authLoading || (!!userId && isLoading),
    hasRole,
  };
}
