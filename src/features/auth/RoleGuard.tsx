import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useTenant, type TenantRole } from "./useTenant";
import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  roles: TenantRole[];
  children: ReactNode;
  /** Where to send unauthorized users. Defaults to /dashboard. */
  fallback?: string;
}

/**
 * Route-level guard. Assumes the parent already ensured an authenticated
 * session (via <ProtectedRoute> / useAuth). Checks that the current tenant
 * membership has one of the required roles.
 */
export function RoleGuard({ roles, children, fallback = "/dashboard" }: RoleGuardProps) {
  const { session, loading: authLoading } = useAuth();
  const { role, loading } = useTenant();

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Verificando permisos…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!role || !roles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}
