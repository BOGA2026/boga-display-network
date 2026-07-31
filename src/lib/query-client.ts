/**
 * QueryClient central + registro de query keys e invalidaciones.
 *
 * Regla del proyecto: nunca llamar `queryClient.invalidateQueries` con un array
 * literal. Usá `invalidate.*` para que las keys vivan en un solo lugar.
 */
import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { logError } from "@/lib/errorLogger";

/** No reintentar errores de cliente (401/403/404): solo fallos transitorios. */
function shouldRetry(failureCount: number, error: unknown) {
  const status =
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status;
  if (typeof status === "number" && status >= 400 && status < 500) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: shouldRetry,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: 0,
      onError: (error) => logError(error, { label: "mutation" }),
    },
  },
});

/** Fuente única de verdad de las query keys. */
export const queryKeys = {
  locations: (userId?: string) => ["locations", userId] as const,
  subscription: () => ["subscription-full"] as const,
  businessId: () => ["user-business-id"] as const,
  dashboardStats: () => ["dashboard-stats"] as const,

  screensForSchedule: (businessId?: string) => ["screens-for-schedule", businessId] as const,
  playlistsForSchedule: (businessId?: string) => ["playlists-for-schedule", businessId] as const,
  scheduleLayers: (businessId?: string) => ["schedule-layers", businessId] as const,
  scheduleBlocks: (screenId?: string) => ["schedule-blocks", screenId] as const,
  scheduleTemplates: (businessId?: string) => ["schedule-templates", businessId] as const,

  playlists: () => ["playlists"] as const,
  playlistItems: (playlistId?: string | null) => ["playlist-items", playlistId] as const,
  availableContent: () => ["available-content"] as const,

  adminScreens: () => ["admin", "screens"] as const,

  offlineEvents: (deviceId?: string) => ["offline-events", deviceId] as const,
  uptime: (deviceId?: string, days?: number) => ["uptime", deviceId, days] as const,
} satisfies Record<string, (...args: any[]) => QueryKey>;

function invalidateKey(queryKey: QueryKey) {
  return queryClient.invalidateQueries({ queryKey });
}

/** Helpers de invalidación — usar SIEMPRE estos en vez de keys literales. */
export const invalidate = {
  locations: (userId?: string) => invalidateKey(queryKeys.locations(userId)),
  subscription: () => invalidateKey(queryKeys.subscription()),
  dashboardStats: () => invalidateKey(queryKeys.dashboardStats()),

  /** Todos los bloques (cualquier pantalla) o los de una pantalla puntual. */
  scheduleBlocks: (screenId?: string) =>
    invalidateKey(screenId ? queryKeys.scheduleBlocks(screenId) : (["schedule-blocks"] as const)),
  scheduleLayers: (businessId?: string) =>
    invalidateKey(businessId ? queryKeys.scheduleLayers(businessId) : (["schedule-layers"] as const)),
  scheduleTemplates: (businessId?: string) =>
    invalidateKey(businessId ? queryKeys.scheduleTemplates(businessId) : (["schedule-templates"] as const)),

  playlists: () => invalidateKey(queryKeys.playlists()),
  playlistItems: (playlistId?: string | null) => invalidateKey(queryKeys.playlistItems(playlistId)),
  availableContent: () => invalidateKey(queryKeys.availableContent()),

  adminScreens: () => invalidateKey(queryKeys.adminScreens()),

  monitoring: (deviceId?: string) =>
    Promise.all([
      invalidateKey(queryKeys.offlineEvents(deviceId)),
      invalidateKey(["uptime", deviceId] as const),
    ]),

  /** Escotilla de emergencia: refresca todo el caché. */
  all: () => queryClient.invalidateQueries(),
};

export default queryClient;
