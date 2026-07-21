import { supabase } from "@/integrations/supabase/client";
import type { MonitoredDevice, DeviceStatus } from "./store";

export async function fetchDevicesForBusiness(businessId: string): Promise<MonitoredDevice[]> {
  const { data, error } = await supabase
    .from("devices")
    .select(
      "id, business_id, screen_id, screen_name, status, latitude, longitude, address, last_seen_at, app_version, resolution, network_type, paired_at",
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, status: (r.status ?? "pending") as DeviceStatus })) as MonitoredDevice[];
}

export interface OfflineEvent {
  id: string;
  device_id: string;
  went_offline_at: string;
  came_online_at: string | null;
  duration_seconds: number | null;
}

export async function fetchOfflineEvents(deviceId: string, limit = 30): Promise<OfflineEvent[]> {
  const { data, error } = await supabase
    .from("device_offline_events")
    .select("id, device_id, went_offline_at, came_online_at, duration_seconds")
    .eq("device_id", deviceId)
    .order("went_offline_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/**
 * Compute powered-on hours from offline events, per calendar day (device tz = UTC for simplicity).
 * "Powered on" = total wall-clock hours in day minus offline intervals within that day.
 * Returns most recent `days` entries (oldest → newest).
 */
export async function fetchUptimeByDay(
  deviceId: string,
  days = 7,
): Promise<Array<{ date: string; onHours: number; offHours: number }>> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const { data, error } = await supabase
    .from("device_offline_events")
    .select("went_offline_at, came_online_at, duration_seconds")
    .eq("device_id", deviceId)
    .gte("went_offline_at", since.toISOString());
  if (error) throw error;

  // Bucket per YYYY-MM-DD
  const dayMs = 24 * 3600 * 1000;
  const buckets: Record<string, number> = {}; // dateKey → offline seconds
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startEdge = new Date(today.getTime() - (days - 1) * dayMs);

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  for (let i = 0; i < days; i++) buckets[iso(new Date(startEdge.getTime() + i * dayMs))] = 0;

  for (const ev of data ?? []) {
    const start = new Date(ev.went_offline_at).getTime();
    const end = ev.came_online_at ? new Date(ev.came_online_at).getTime() : Date.now();
    // Split interval across days it spans
    let cursor = Math.max(start, startEdge.getTime());
    while (cursor < end) {
      const dayStart = new Date(cursor);
      dayStart.setUTCHours(0, 0, 0, 0);
      const nextDay = dayStart.getTime() + dayMs;
      const sliceEnd = Math.min(end, nextDay);
      const key = iso(dayStart);
      if (key in buckets) buckets[key] += (sliceEnd - cursor) / 1000;
      cursor = sliceEnd;
    }
  }

  return Object.entries(buckets).map(([date, offSecs]) => {
    const offHours = Math.min(24, offSecs / 3600);
    return { date, onHours: +(24 - offHours).toFixed(2), offHours: +offHours.toFixed(2) };
  });
}

export async function updateDeviceLocation(
  id: string,
  patch: { latitude?: number | null; longitude?: number | null; address?: string | null },
) {
  const { error } = await supabase.from("devices").update(patch).eq("id", id);
  if (error) throw error;
}
