import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { navEntryByPath } from "@/config/lexicon";

const SUFFIX = "Visualia";

/**
 * Mantiene `document.title` sincronizado con NAV[key].pageTitle.
 * Nunca escribas títulos a mano en las páginas del dashboard.
 */
export function useDocumentTitle(explicit?: string) {
  const { pathname } = useLocation();

  useEffect(() => {
    const entry = navEntryByPath(pathname);
    const title = explicit ?? entry?.pageTitle;
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
  }, [pathname, explicit]);
}
