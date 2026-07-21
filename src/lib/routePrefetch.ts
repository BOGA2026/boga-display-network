/**
 * Route prefetch registry.
 *
 * Cada entrada dispara el mismo `import()` que usa `React.lazy` en App.tsx.
 * Al pasar el mouse por un item del sidebar (o al enfocarlo con teclado),
 * el chunk se descarga en background y la siguiente navegación es
 * instantánea — sin flash de Suspense.
 *
 * Los imports se memorizan automáticamente por el módulo (una sola descarga).
 */

const cache = new Map<string, Promise<unknown>>();

function once(key: string, load: () => Promise<unknown>) {
  return () => {
    if (!cache.has(key)) cache.set(key, load().catch(() => cache.delete(key)));
    return cache.get(key);
  };
}

export const prefetchRoute: Record<string, () => void> = {
  "/dashboard": once("dashboard", () => import("@/pages/Dashboard")),
  "/dashboard/pantallas": once("screens", () => import("@/pages/Screens")),
  "/dashboard/contenido": once("content", () => import("@/pages/Content")),
  "/dashboard/playlists": once("playlists", () => import("@/pages/Playlists")),
  "/dashboard/programacion": once("schedule", () => import("@/pages/Schedule")),
  "/dashboard/mapa": once("map", () => import("@/pages/DashboardMap")),
  "/dashboard/monitoreo": once("monitoring", () => import("@/pages/Monitoring")),
  "/dashboard/qr": once("qr", () => import("@/pages/QRCodes")),
  "/dashboard/analiticas": once("analytics", () => import("@/pages/Analytics")),
  "/dashboard/suscripcion": once("subscription", () => import("@/pages/Subscription")),
  "/dashboard/generar-ia": once("generateAi", () => import("@/pages/GenerateAI")),
  "/dashboard/editor": once("editor", () => import("@/pages/EditorPage")),
  "/dashboard/soporte": once("soporte", () => import("@/pages/Soporte")),
  "/dashboard/leads": once("leads", () => import("@/pages/AdminLeadsPage")),
  "/admin": once("adminOverview", () => import("@/pages/admin/AdminOverview")),
  "/admin/trafico": once("adminTraffic", () => import("@/pages/admin/AdminTraffic")),
  "/admin/suscripciones": once("adminSubs", () => import("@/pages/admin/AdminSubscriptions")),
  "/admin/pagos": once("adminPayments", () => import("@/pages/admin/AdminPayments")),
  "/admin/pantallas": once("adminScreens", () => import("@/pages/admin/AdminScreens")),
  "/admin/mapa": once("adminMap", () => import("@/pages/admin/AdminMap")),
  "/admin/negocios": once("adminBiz", () => import("@/pages/admin/AdminBusinesses")),
  "/admin/pqrs": once("adminPqrs", () => import("@/pages/admin/AdminPQRS")),
  "/admin/soporte": once("adminSupport", () => import("@/pages/admin/AdminSupport")),
  "/admin/leads": once("adminLeads", () => import("@/pages/AdminLeadsPage")),
  "/admin/admins": once("adminAdmins", () => import("@/pages/admin/AdminAdmins")),
};

export function prefetch(path: string) {
  prefetchRoute[path]?.();
}
