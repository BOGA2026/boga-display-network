/**
 * LocationContext — active business location shared across the dashboard.
 *
 * Rationale:
 * - Single source of truth for "which sede am I looking at?".
 * - Persisted per user in localStorage so refreshing keeps context.
 * - `activeLocationId === null` means "Todas las sedes"; consumers should
 *   skip the .eq("location_id", ...) filter in that case.
 * - Uses supabase RLS to scope to the user's business; no manual business_id
 *   filtering needed on the client.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Location = {
  id: string;
  name: string;
  address: string | null;
  business_id: string;
};

type Ctx = {
  locations: Location[];
  loading: boolean;
  activeLocationId: string | null;
  activeLocation: Location | null;
  setActiveLocationId: (id: string | null) => void;
};

const LocationContext = React.createContext<Ctx | null>(null);

const STORAGE_KEY = "dash.location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, address, business_id")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Location[];
    },
    staleTime: 60_000,
  });

  const [activeLocationId, setActiveLocationIdState] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  const setActiveLocationId = React.useCallback((id: string | null) => {
    setActiveLocationIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // If the stored id is no longer valid, clear it.
  React.useEffect(() => {
    if (!locations.length || !activeLocationId) return;
    if (!locations.find((l) => l.id === activeLocationId)) {
      setActiveLocationId(null);
    }
  }, [locations, activeLocationId, setActiveLocationId]);

  const activeLocation = React.useMemo(
    () => locations.find((l) => l.id === activeLocationId) ?? null,
    [locations, activeLocationId]
  );

  const value = React.useMemo<Ctx>(
    () => ({
      locations,
      loading: isLoading,
      activeLocationId,
      activeLocation,
      setActiveLocationId,
    }),
    [locations, isLoading, activeLocationId, activeLocation, setActiveLocationId]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const ctx = React.useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext must be used within LocationProvider");
  return ctx;
}

/**
 * Convenience for supabase queries:
 *   const filter = useLocationFilter();
 *   let q = supabase.from("screens").select("*");
 *   q = filter(q);
 */
export function useLocationFilter() {
  const { activeLocationId } = useLocationContext();
  return React.useCallback(
    <T extends { eq: (col: string, val: string) => T }>(query: T, column = "location_id") => {
      if (!activeLocationId) return query;
      return query.eq(column, activeLocationId);
    },
    [activeLocationId]
  );
}
