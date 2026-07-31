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

/**
 * Presets de opciones por tipo de consulta.
 *
 * `placeholderData` NO va en los defaults globales: mantener los datos previos
 * mientras cambia la key solo tiene sentido cuando la key representa un filtro
 * sobre el mismo conjunto de datos. Si la key es el ID de una entidad
 * (por ejemplo `playlistItems(playlistId)`), conservar lo anterior muestra los
 * ítems de la playlist vieja bajo el nombre de la nueva: se lee como un bug.
 */

/** Listas con paginación, búsqueda o filtros: la key cambia, el dataset no. */
export const filterQueryOptions = {
  placeholderData: <T>(prev: T | undefined) => prev,
  staleTime: 30 * 1000,
} as const;

/** Datos que cambian solos: sondeo cada 30 s, pausado si la pestaña está oculta. */
export const liveQueryOptions = {
  staleTime: 10 * 1000,
  refetchInterval: 30 * 1000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
} as const;

/** Catálogos y configuración: cambian poco, se pueden cachear con calma. */
export const staticQueryOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;



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
