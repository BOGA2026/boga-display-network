import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TenantRole = "owner" | "admin" | "manager" | "content_editor" | "viewer";

export interface TenantMembership {
  business_id: string;
  role: TenantRole;
  business_name?: string | null;
}

interface TenantState {
  loading: boolean;
  memberships: TenantMembership[];
  current: TenantMembership | null;
}

const STORAGE_KEY = "visualia_current_tenant";

/**
 * Multi-tenant awareness hook. Reads business_memberships for the signed-in
 * user, exposes the currently-active tenant, and helpers to switch it.
 */
export function useTenant() {
  const [state, setState] = useState<TenantState>({
    loading: true,
    memberships: [],
    current: null,
  });

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState({ loading: false, memberships: [], current: null });
      return;
    }
    const { data } = await supabase
      .from("business_memberships")
      .select("business_id, role, businesses(name)")
      .eq("user_id", user.id);

    const memberships: TenantMembership[] = (data ?? []).map((m: any) => ({
      business_id: m.business_id,
      role: m.role as TenantRole,
      business_name: m.businesses?.name ?? null,
    }));

    const stored = localStorage.getItem(STORAGE_KEY);
    const current =
      memberships.find((m) => m.business_id === stored) ?? memberships[0] ?? null;

    setState({ loading: false, memberships, current });
  }, []);

  useEffect(() => {
    void load();
    const { data } = supabase.auth.onAuthStateChange(() => void load());
    return () => data.subscription.unsubscribe();
  }, [load]);

  const setCurrent = useCallback((business_id: string) => {
    localStorage.setItem(STORAGE_KEY, business_id);
    setState((s) => ({
      ...s,
      current: s.memberships.find((m) => m.business_id === business_id) ?? s.current,
    }));
  }, []);

  const hasRole = useCallback(
    (roles: TenantRole | TenantRole[]) => {
      if (!state.current) return false;
      const list = Array.isArray(roles) ? roles : [roles];
      return list.includes(state.current.role);
    },
    [state.current]
  );

  return { ...state, setCurrent, hasRole, reload: load };
}
