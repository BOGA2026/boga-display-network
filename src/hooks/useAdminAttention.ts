import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Todo lo que necesita atención hoy en el panel master.
 * Alimenta la franja de alertas y las listas accionables del Resumen.
 */
export type OfflineScreen = {
  id: string;
  name: string;
  business_name: string;
  location_name: string;
  last_seen_at: string | null;
  hours_offline: number | null;
};

export type PendingLead = {
  id: string;
  name: string | null;
  company: string | null;
  city: string | null;
  whatsapp: string | null;
  phone: string | null;
  created_at: string | null;
};

const HOURS_48 = 48;

async function fetchAttention() {
  const cutoff = new Date(Date.now() - HOURS_48 * 3600_000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  const [screensRes, leadsRes, leadsWeekRes, locationsRes] = await Promise.all([
    (supabase as any)
      .from("screens")
      .select("id, name, last_seen_at, locations!inner(name, business_id, businesses(name))")
      .or(`last_seen_at.is.null,last_seen_at.lt.${cutoff}`)
      .order("last_seen_at", { ascending: true, nullsFirst: true })
      .limit(50),
    (supabase as any)
      .from("leads")
      .select("id, name, company, city, whatsapp, phone, created_at, status")
      .eq("status", "nuevo")
      .order("created_at", { ascending: false })
      .limit(50),
    (supabase as any)
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    (supabase as any)
      .from("locations")
      .select("id, name, business_id, latitude, longitude, businesses(name)")
      .or("latitude.is.null,longitude.is.null")
      .limit(50),
  ]);

  const offlineScreens: OfflineScreen[] = ((screensRes.data as any[]) ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    business_name: s.locations?.businesses?.name ?? "Sin negocio",
    location_name: s.locations?.name ?? "Sin sede",
    last_seen_at: s.last_seen_at,
    hours_offline: s.last_seen_at
      ? Math.floor((Date.now() - new Date(s.last_seen_at).getTime()) / 3600_000)
      : null,
  }));

  const pendingLeads: PendingLead[] = ((leadsRes.data as any[]) ?? []) as PendingLead[];

  const missingCoords = new Map<string, string>();
  for (const l of ((locationsRes.data as any[]) ?? [])) {
    missingCoords.set(l.business_id, l.businesses?.name ?? "Negocio sin nombre");
  }

  return {
    offlineScreens,
    pendingLeads,
    leadsThisWeek: (leadsWeekRes as any)?.count ?? 0,
    businessesMissingCoords: [...missingCoords.entries()].map(([id, name]) => ({ id, name })),
  };
}

export function useAdminAttention() {
  const query = useQuery({
    queryKey: ["admin", "attention"],
    queryFn: fetchAttention,
    staleTime: 30_000,
  });

  return {
    ...query,
    offlineScreens: query.data?.offlineScreens ?? [],
    pendingLeads: query.data?.pendingLeads ?? [],
    leadsThisWeek: query.data?.leadsThisWeek ?? 0,
    businessesMissingCoords: query.data?.businessesMissingCoords ?? [],
  };
}
