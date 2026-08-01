import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { deriveLiveStatus } from "@shared/offlineThreshold";

export type DeviceLiveStatus = "online" | "offline" | "syncing" | "unknown";

interface DeviceStatusState {
  status: DeviceLiveStatus;
  lastSeenAt: string | null;
}

/**
 * Subscribes to a single device row via Supabase Realtime and derives its
 * live status without polling. The device is considered:
 * Usa el mismo umbral compartido que las edge functions
 * (`@shared/offlineThreshold`): online dentro de la ventana, "sincronizando"
 * dentro de la gracia, y desconectado más allá o si la columna dice offline.
 */
export function useDeviceStatus(deviceId: string | null | undefined) {
  const [state, setState] = useState<DeviceStatusState>({
    status: "unknown",
    lastSeenAt: null,
  });

  useEffect(() => {
    if (!deviceId) return;

    let cancelled = false;

    const derive = (lastSeen: string | null, rawStatus: string | null): DeviceLiveStatus => {
      if (rawStatus === "offline") return "offline";
      return deriveLiveStatus(lastSeen);
    };

    // Prime state
    (async () => {
      const { data } = await supabase
        .from("devices")
        .select("last_seen_at, status")
        .eq("id", deviceId)
        .maybeSingle();
      if (cancelled) return;
      setState({
        lastSeenAt: data?.last_seen_at ?? null,
        status: derive(data?.last_seen_at ?? null, data?.status ?? null),
      });
    })();

    const channel = supabase
      .channel(`device-status-${deviceId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "devices", filter: `id=eq.${deviceId}` },
        (payload) => {
          const row = payload.new as { last_seen_at?: string | null; status?: string | null };
          setState({
            lastSeenAt: row.last_seen_at ?? null,
            status: derive(row.last_seen_at ?? null, row.status ?? null),
          });
        }
      )
      .subscribe();

    // Also re-derive on a 30s tick so a device that stops heart-beating flips to offline.
    const interval = setInterval(() => {
      setState((s) => ({ ...s, status: derive(s.lastSeenAt, null) }));
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  return state;
}
