import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OverviewRow {
  screens_total: number;
  screens_online: number;
  uptime_pct: number;
  playbacks: number;
  total_play_ms: number;
}

/**
 * Los medios viven en `content` (no en `content_items`, que son renglones de
 * menú), por eso la clave es `content_id`. `duration_seconds` viene de
 * `content` y permite calcular tiempo en pantalla sin depender de duration_ms.
 */
export interface TopContentRow {
  content_id: string;
  name: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  playbacks: number;
  total_ms: number;
}

export interface ScreenTableRow {
  screen_id: string;
  name: string;
  location: string;
  uptime_pct: number;
  playbacks: number;
  last_seen_at: string | null;
  status: string;
}

type Range = { from: Date | string; to: Date | string };

const iso = (v: Date | string) => (typeof v === "string" ? v : v.toISOString());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

export function useAnalyticsOverview(businessId?: string, range?: Range) {
  return useQuery({
    queryKey: ["analytics", "overview", businessId, range && iso(range.from), range && iso(range.to)],
    enabled: Boolean(businessId && range),
    queryFn: async (): Promise<OverviewRow | null> => {
      const { data, error } = await rpc("analytics_overview", {
        p_business_id: businessId,
        p_from: iso(range!.from),
        p_to: iso(range!.to),
      });
      if (error) throw error;
      return (data as OverviewRow[])?.[0] ?? null;
    },
  });
}

export function useTopContent(businessId?: string, range?: Range, limit = 10) {
  return useQuery({
    queryKey: ["analytics", "top-content", businessId, range && iso(range.from), range && iso(range.to), limit],
    enabled: Boolean(businessId && range),
    queryFn: async (): Promise<TopContentRow[]> => {
      const { data, error } = await rpc("analytics_top_content", {
        p_business_id: businessId,
        p_from: iso(range!.from),
        p_to: iso(range!.to),
        p_limit: limit,
      });
      if (error) throw error;
      return (data as TopContentRow[]) ?? [];
    },
  });
}

export function useScreenTable(businessId?: string, range?: Range) {
  return useQuery({
    queryKey: ["analytics", "screens", businessId, range && iso(range.from), range && iso(range.to)],
    enabled: Boolean(businessId && range),
    queryFn: async (): Promise<ScreenTableRow[]> => {
      const { data, error } = await rpc("analytics_screen_table", {
        p_business_id: businessId,
        p_from: iso(range!.from),
        p_to: iso(range!.to),
      });
      if (error) throw error;
      return (data as ScreenTableRow[]) ?? [];
    },
  });
}
