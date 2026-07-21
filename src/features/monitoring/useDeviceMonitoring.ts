import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMonitoringStore, type MonitoredDevice, type DeviceStatus } from "./store";
import { fetchDevicesForBusiness } from "./api";

/**
 * Realtime bridge with throttled batching.
 *
 * Two-tier freshness:
 *  1. Realtime UPDATEs on `public.devices` push into a queue; a 250 ms timer
 *     flushes the queue into the Zustand store as ONE React commit.
 *     This gives "milimétrico" feel (≤ 250 ms lag) without a re-render per row.
 *  2. A local 5 s tick calls `refreshDerived()` — flips online→offline the
 *     instant a device's `last_seen_at` crosses the 90 s threshold, without
 *     waiting for the server sweep. The DB trigger + `sweep-devices` edge
 *     function remain the authoritative log.
 */
export function useDeviceMonitoring(businessId: string | null | undefined) {
  const hydrate = useMonitoringStore((s) => s.hydrate);
  const upsert = useMonitoringStore((s) => s.upsert);
  const remove = useMonitoringStore((s) => s.remove);
  const refreshDerived = useMonitoringStore((s) => s.refreshDerived);

  const queueRef = useRef<MonitoredDevice[]>([]);
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;

    fetchDevicesForBusiness(businessId).then((rows) => {
      if (!cancelled) hydrate(rows);
    });

    const flush = () => {
      flushTimerRef.current = null;
      const items = queueRef.current;
      queueRef.current = [];
      // Coalesce: keep only latest per id
      const latest = new Map<string, MonitoredDevice>();
      for (const it of items) latest.set(it.id, it);
      latest.forEach((row) => upsert(row));
    };

    const schedule = () => {
      if (flushTimerRef.current != null) return;
      flushTimerRef.current = window.setTimeout(flush, 250);
    };

    const channel = supabase
      .channel(`monitoring-${businessId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "devices", filter: `business_id=eq.${businessId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (oldRow?.id) remove(oldRow.id);
            return;
          }
          const r = payload.new as Partial<MonitoredDevice> & { id: string };
          queueRef.current.push({
            id: r.id,
            business_id: r.business_id ?? businessId,
            screen_id: r.screen_id ?? null,
            screen_name: r.screen_name ?? null,
            status: (r.status ?? "pending") as DeviceStatus,
            latitude: r.latitude ?? null,
            longitude: r.longitude ?? null,
            address: r.address ?? null,
            last_seen_at: r.last_seen_at ?? null,
            app_version: r.app_version ?? null,
            resolution: r.resolution ?? null,
            network_type: r.network_type ?? null,
            paired_at: r.paired_at ?? null,
          });
          schedule();
        },
      )
      .subscribe();

    // Derived-state tick — cheap local check, no network.
    const tickId = window.setInterval(() => refreshDerived(), 5000);

    return () => {
      cancelled = true;
      if (flushTimerRef.current != null) window.clearTimeout(flushTimerRef.current);
      window.clearInterval(tickId);
      supabase.removeChannel(channel);
    };
  }, [businessId, hydrate, upsert, remove, refreshDerived]);
}

/** Format "hace Xs / Xm / Xh" without external deps. */
export function formatRelative(ts: string | null | undefined, now = Date.now()): string {
  if (!ts) return "sin datos";
  const diff = Math.max(0, Math.floor((now - new Date(ts).getTime()) / 1000));
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}
