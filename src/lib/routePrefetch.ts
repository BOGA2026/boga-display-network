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
  "/dashboard/playlists": () => import("@/pages/Playlists"),
  "/dashboard/programacion": () => import("@/pages/Schedule"),
  "/dashboard/mapa": () => import("@/pages/DashboardMap"),
  "/dashboard/monitoreo": () => import("@/pages/Monitoring"),
  "/dashboard/qr": () => import("@/pages/QRCodes"),
  "/dashboard/analiticas": () => import("@/pages/Analytics"),
  "/dashboard/suscripcion": () => import("@/pages/Subscription"),
  "/dashboard/generar-ia": () => import("@/pages/GenerateAI"),
  "/dashboard/editor": () => import("@/pages/EditorPage"),
  "/dashboard/soporte": () => import("@/pages/Soporte"),
  "/dashboard/leads": () => import("@/pages/AdminLeadsPage"),

  // Admin
  "/admin": () => import("@/pages/admin/AdminOverview"),
  "/admin/trafico": () => import("@/pages/admin/AdminTraffic"),
  "/admin/suscripciones": () => import("@/pages/admin/AdminSubscriptions"),
  "/admin/pagos": () => import("@/pages/admin/AdminPayments"),
  "/admin/pantallas": () => import("@/pages/admin/AdminScreens"),
  "/admin/mapa": () => import("@/pages/admin/AdminMap"),
  "/admin/negocios": () => import("@/pages/admin/AdminBusinesses"),
  "/admin/pqrs": () => import("@/pages/admin/AdminPQRS"),
  "/admin/soporte": () => import("@/pages/admin/AdminSupport"),
  "/admin/leads": () => import("@/pages/AdminLeadsPage"),
  "/admin/admins": () => import("@/pages/admin/AdminAdmins"),
};

const cache = new Map<string, Promise<unknown>>();

export function prefetch(key: string) {
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
