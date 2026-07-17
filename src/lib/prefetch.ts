/**
 * Route + data prefetch helpers for public pages.
 *
 * Public pages (Landing, Pricing, About, Restaurant, DescargarApk) are all
 * lazy-loaded in App.tsx. We warm up their JS chunks — and any future data
 * queries — on idle time and on nav-link hover so navigation between public
 * pages feels instant and effectively reduces perceived TTFB.
 */
import type { QueryClient } from "@tanstack/react-query";

// Map route paths → dynamic import factories. Importing the module triggers
// Vite/Rollup to fetch the chunk; the browser caches it for the real navigation.
const routeLoaders: Record<string, () => Promise<unknown>> = {
  "/precios": () => import("@/pages/Pricing"),
  "/acerca": () => import("@/pages/AboutPage"),
  "/soluciones/restaurantes": () => import("@/pages/RestaurantSolutionPage"),
  "/descargar-apk": () => import("@/pages/DescargarApk"),
  "/studio": () => import("@/pages/Studio"),
  "/login": () => import("@/pages/Login"),
  "/registro": () => import("@/pages/Register"),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = routeLoaders[path];
  if (!loader) return;
  prefetched.add(path);
  // Fire and forget — swallow errors so a failed prefetch never breaks nav.
  loader().catch(() => prefetched.delete(path));
}

type IdleCb = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;
type IdleWindow = Window & {
  requestIdleCallback?: (cb: IdleCb, opts?: { timeout: number }) => number;
};

function onIdle(cb: () => void, timeout = 2000) {
  if (typeof window === "undefined") return;
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(() => cb(), { timeout });
  } else {
    setTimeout(cb, 300);
  }
}

/**
 * Warm up the most likely next public routes after the current page is idle.
 * Safe to call from a `useEffect` on any public page.
 */
export function prefetchPublicRoutes(paths: string[]) {
  onIdle(() => {
    paths.forEach(prefetchRoute);
  });
}

/**
 * Generic data prefetch through the shared QueryClient. Public pages don't
 * currently fetch remote data, but this hook is here so any future public
 * queries (pricing plans, marketing content, etc.) can be warmed the same way
 * without re-plumbing.
 */
export function prefetchQuery<T>(
  queryClient: QueryClient,
  key: readonly unknown[],
  fn: () => Promise<T>,
  staleTime = 5 * 60 * 1000,
) {
  return queryClient.prefetchQuery({ queryKey: key, queryFn: fn, staleTime });
}
