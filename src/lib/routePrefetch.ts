/**
 * Route prefetch registry.
 *
 * Fuente única de verdad de los `import()` de cada ruta: `routes.tsx` los usa
 * con `React.lazy`, y el sidebar los dispara en hover/focus. Como es el mismo
 * módulo, el navegador ya tiene el chunk cacheado y la navegación es instantánea.
 */

export const routeLoaders: Record<string, () => Promise<any>> = {
  // Públicas
  "/precios": () => import("@/pages/Pricing"),
  "/acerca": () => import("@/pages/AboutPage"),
  "/soluciones/restaurantes": () => import("@/pages/RestaurantSolutionPage"),
  "/descargar-apk": () => import("@/pages/DescargarApk"),
  "/studio": () => import("@/pages/Studio"),
  "/login": () => import("@/pages/Login"),
  "/registro": () => import("@/pages/Register"),

  // Dashboard
  "/dashboard": () => import("@/pages/Dashboard"),
  "/dashboard/pantallas": () => import("@/pages/Screens"),
  "/dashboard/pantallas/:id": () => import("@/pages/ScreenDetail"),
  "/dashboard/contenido": () => import("@/pages/Content"),
  "/dashboard/listas": () => import("@/pages/Playlists"),
  "/dashboard/programacion": () => import("@/pages/Schedule"),
  "/dashboard/mapa": () => import("@/pages/DashboardMap"),
  "/dashboard/monitoreo": () => import("@/pages/Monitoring"),
  "/dashboard/qr": () => import("@/pages/QRCodes"),
  "/dashboard/analiticas": () => import("@/pages/Analytics"),
  "/dashboard/suscripcion": () => import("@/pages/Subscription"),
  "/dashboard/ajustes": () => import("@/pages/BusinessSettings"),
  "/dashboard/generar-ia": () => import("@/pages/GenerateAI"),
  "/dashboard/editor": () => import("@/pages/EditorPage"),
  "/dashboard/soporte": () => import("@/pages/Soporte"),
  "/dashboard/leads": () => import("@/pages/AdminLeadsPage"),

  // Admin
  "/master": () => import("@/pages/admin/AdminOverview"),
  "/master/trafico": () => import("@/pages/admin/AdminTraffic"),
  "/master/suscripciones": () => import("@/pages/admin/AdminSubscriptions"),
  "/master/pagos": () => import("@/pages/admin/AdminPayments"),
  "/master/pantallas": () => import("@/pages/admin/AdminScreens"),
  "/master/mapa": () => import("@/pages/admin/AdminMap"),
  "/master/negocios": () => import("@/pages/admin/AdminBusinesses"),
  "/master/negocios/:id/diagnostico": () => import("@/pages/admin/AdminBusinessDiagnostics"),

  "/master/pqrs": () => import("@/pages/admin/AdminPQRS"),
  "/master/soporte": () => import("@/pages/admin/AdminSupport"),
  "/master/leads": () => import("@/pages/AdminLeadsPage"),
  "/master/admins": () => import("@/pages/admin/AdminAdmins"),
};

const cache = new Map<string, Promise<unknown>>();

export function prefetch(key: string) {
  // Código y datos en paralelo, desde el mismo hover.
  prefetchData(key);
  const load = routeLoaders[key];
  if (!load || cache.has(key)) return;
  cache.set(
    key,
    load().catch((e) => {
      cache.delete(key);
      return e;
    })
  );
}

/**
 * Props listos para hacer spread en cualquier <Link>:
 *   <Link to={path} {...prefetchHandlers(path)} />
 */
export function prefetchHandlers(key: string) {
  const run = () => prefetch(key);
  return {
    onMouseEnter: run,
    onFocus: run,
    onTouchStart: run,
  };
}

/** Compat: registry por path usado antes en el sidebar admin. */
export const prefetchRoute: Record<string, () => void> = Object.keys(routeLoaders).reduce(
  (acc, key) => {
    acc[key] = () => prefetch(key);
    return acc;
  },
  {} as Record<string, () => void>
);

/* ------------------------------------------------------------------ *
 * Prefetch de DATOS
 *
 * El chunk resuelve en 2-3 ms en producción; lo que queda es la cascada
 * chunk → montar → consultar Supabase. En el mismo hover adelantamos la
 * consulta principal de la sección con EXACTAMENTE la misma queryKey que
 * usa el hook de la página (si no coincide al carácter, react-query no
 * reutiliza la caché y el prefetch no sirve de nada).
 *
 * Analíticas y Monitoreo quedan fuera a propósito: son consultas caras,
 * se visitan menos y no vale gastarlas en un hover accidental.
 * ------------------------------------------------------------------ */
import { queryClient, staticQueryOptions } from "@/lib/query-client";
import {
  PAGE_STALE_TIME,
  fetchScreensPage,
  fetchContentList,
  fetchPlaylists,
} from "@/lib/pageQueries";
import {
  businessIdQuery,
  screensForScheduleQuery,
  playlistsForScheduleQuery,
} from "@/hooks/useScheduleData";
import { subscriptionQuery } from "@/hooks/useSubscriptionData";

/** Keys compartidas entre el prefetch y las páginas. */
export const pageQueryKeys = {
  screensPage: ["screens-page"] as const,
  contentList: ["content-list"] as const,
  playlists: ["playlists"] as const,
};

const dataLoaders: Record<string, () => Promise<unknown>> = {
  "/dashboard/pantallas": () =>
    queryClient.prefetchQuery({
      queryKey: pageQueryKeys.screensPage,
      queryFn: fetchScreensPage,
      staleTime: PAGE_STALE_TIME,
    }),

  "/dashboard/contenido": () =>
    queryClient.prefetchQuery({
      queryKey: pageQueryKeys.contentList,
      queryFn: fetchContentList,
      staleTime: PAGE_STALE_TIME,
    }),

  "/dashboard/listas": () =>
    queryClient.prefetchQuery({
      queryKey: pageQueryKeys.playlists,
      queryFn: fetchPlaylists,
      staleTime: PAGE_STALE_TIME,
    }),

  "/dashboard/programacion": async () => {
    const businessId = await queryClient.fetchQuery({
      ...businessIdQuery,
      staleTime: PAGE_STALE_TIME,
    });
    await Promise.all([
      queryClient.prefetchQuery({
        ...screensForScheduleQuery(businessId),
        staleTime: staticQueryOptions.staleTime,
      }),
      queryClient.prefetchQuery({
        ...playlistsForScheduleQuery(businessId),
        staleTime: staticQueryOptions.staleTime,
      }),
    ]);
  },

  "/dashboard/suscripcion": () =>
    queryClient.prefetchQuery({
      ...subscriptionQuery,
      staleTime: staticQueryOptions.staleTime,
    }),
};

/** Un solo prefetch de datos por clave por sesión. */
const dataPrefetched = new Set<string>();

export function prefetchData(key: string) {
  const load = dataLoaders[key];
  if (!load || dataPrefetched.has(key)) return;
  dataPrefetched.add(key);
  // Si falla, falla en silencio: el componente reintenta al montar.
  void Promise.resolve()
    .then(load)
    .catch(() => dataPrefetched.delete(key));
}
