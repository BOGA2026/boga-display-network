/**
 * Monitoring store (Zustand).
 *
 * Why Zustand: React Query is great for request/response, but the device map
 * receives a stream of tiny incremental updates (heartbeats). We don't want to
 * re-render the entire map for each row change. Zustand lets components
 * subscribe to just the slice they care about (`useStore(s => s.devices[id])`).
 *
 * Perf strategy:
 *  - `applyHeartbeat` mutates a single device entry and touches an update
 *    counter — components that render pins select by id, so only that pin
 *    re-renders.
 *  - Batched writes: incoming Realtime rows are queued and flushed every
 *    250 ms (see `useDeviceMonitoring.ts`). This coalesces bursts of
 *    heartbeats from N devices into a single React commit.
 *  - Offline detection is derived: a tick every 5 s recomputes which devices
 *    have gone stale (`last_seen_at` más viejo que OFFLINE_THRESHOLD_SECONDS,
 *    importado de `@shared/offlineThreshold`) sin pegarle a la base.
 *    El cron `mark-offline-screens` es solo el respaldo autoritativo.
 *  - Las notificaciones salen de la transición del estado DERIVADO en el
 *    cliente (no de la columna `status`), así la alerta y lo que se ve en
 *    pantalla coinciden siempre. `lastNotified` evita repetir la alerta en
 *    cada refetch.
 */
import { create } from "zustand";
import { OFFLINE_THRESHOLD_SECONDS } from "@shared/offlineThreshold";

export type DeviceStatus = "online" | "offline" | "syncing" | "pending";

export interface MonitoredDevice {
  id: string;
  business_id: string;
  screen_id: string | null;
  screen_name: string | null;
  status: DeviceStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  last_seen_at: string | null;
  app_version: string | null;
  resolution: string | null;
  network_type: string | null;
  paired_at: string | null;
}

export interface Notification {
  id: string;
  device_id: string;
  device_name: string;
  kind: "offline" | "online";
  at: number; // epoch ms
  read: boolean;
}

interface MonitoringState {
  devices: Record<string, MonitoredDevice>;
  order: string[]; // stable render order
  tick: number; // bumped on each flush so map layers can diff cheaply
  notifications: Notification[];
  selectedId: string | null;
  offlineThresholdSec: number;
  /** Último estado derivado notificado por dispositivo (anti-duplicados). */
  lastNotified: Record<string, "online" | "offline">;

  hydrate: (rows: MonitoredDevice[]) => void;
  upsert: (row: MonitoredDevice) => void;
  patch: (id: string, patch: Partial<MonitoredDevice>) => void;
  remove: (id: string) => void;
  select: (id: string | null) => void;
  pushNotification: (n: Omit<Notification, "id" | "read">) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  refreshDerived: () => void; // recompute stale → offline transitions locally
}

const isStale = (row: MonitoredDevice, thresholdSec: number): boolean => {
  if (!row.last_seen_at || !row.paired_at) return false;
  const last = new Date(row.last_seen_at).getTime();
  return Date.now() - last > thresholdSec * 1000;
};

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  devices: {},
  order: [],
  tick: 0,
  notifications: [],
  selectedId: null,
  offlineThresholdSec: OFFLINE_THRESHOLD_SECONDS,
  lastNotified: {},

  hydrate: (rows) => {
    const devices: Record<string, MonitoredDevice> = {};
    const order: string[] = [];
    for (const r of rows) {
      devices[r.id] = r;
      order.push(r.id);
    }
    set({ devices, order, tick: get().tick + 1 });
  },

  upsert: (row) =>
    set((s) => {
      const existed = !!s.devices[row.id];
      const prev = s.devices[row.id];
      const devices = { ...s.devices, [row.id]: { ...prev, ...row } };
      const order = existed ? s.order : [...s.order, row.id];
      // Las alertas NO salen de la columna `status`: se disparan desde el
      // estado derivado en `refreshDerived`, que es lo que ve el usuario.
      return { devices, order, tick: s.tick + 1 };
    }),

  patch: (id, patch) =>
    set((s) => {
      if (!s.devices[id]) return s;
      return { devices: { ...s.devices, [id]: { ...s.devices[id], ...patch } }, tick: s.tick + 1 };
    }),

  remove: (id) =>
    set((s) => {
      if (!s.devices[id]) return s;
      const { [id]: _, ...rest } = s.devices;
      return { devices: rest, order: s.order.filter((x) => x !== id), tick: s.tick + 1 };
    }),

  select: (id) => set({ selectedId: id }),

  pushNotification: (n) =>
    set((s) => ({
      notifications: [{ id: `${n.device_id}-${n.kind}-${Date.now()}`, read: false, ...n }, ...s.notifications].slice(
        0,
        100,
      ),
    })),

  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  clearNotifications: () => set({ notifications: [] }),

  refreshDerived: () =>
    set((s) => {
      let changed = false;
      const devices = { ...s.devices };
      const notifications = [...s.notifications];
      for (const id of s.order) {
        const d = devices[id];
        if (!d) continue;
        if (d.status === "online" && isStale(d, s.offlineThresholdSec)) {
          devices[id] = { ...d, status: "offline" };
          notifications.unshift({
            id: `${id}-off-${Date.now()}`,
            device_id: id,
            device_name: d.screen_name ?? id.slice(0, 8),
            kind: "offline",
            at: Date.now(),
            read: false,
          });
          changed = true;
        }
      }
      if (!changed) return s;
      return { devices, notifications: notifications.slice(0, 100), tick: s.tick + 1 };
    }),
}));

export const selectDevicesArray = (s: MonitoringState): MonitoredDevice[] =>
  s.order.map((id) => s.devices[id]).filter(Boolean);

export const selectStatusCounts = (s: MonitoringState) => {
  let online = 0,
    offline = 0,
    syncing = 0,
    pending = 0;
  for (const id of s.order) {
    const st = s.devices[id]?.status;
    if (st === "online") online++;
    else if (st === "offline") offline++;
    else if (st === "syncing") syncing++;
    else pending++;
  }
  return { online, offline, syncing, pending, total: s.order.length };
};
