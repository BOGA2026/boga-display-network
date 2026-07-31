/**
 * Breadcrumbs — trail del dashboard.
 *
 * Las etiquetas salen de `NAV[key].breadcrumb` (src/config/lexicon.ts); nunca
 * se derivan del segmento de la URL.
 */
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, navEntryByPath } from "@/config/lexicon";

export function Breadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation();
  if (!pathname.startsWith("/dashboard")) return null;

  const entry = navEntryByPath(pathname);
  const home = NAV.inicio;

  const crumbs: { href: string; label: string }[] = [
    { href: home.path, label: home.breadcrumb },
  ];
  if (entry && entry.path !== home.path) {
    crumbs.push({ href: entry.path, label: entry.breadcrumb });
  }
  // Sub-ruta de detalle (ej. /dashboard/pantallas/:id)
  if (entry && !entry.end && pathname.startsWith(entry.path + "/")) {
    crumbs.push({ href: pathname, label: "Detalle" });
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <div key={c.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
            {last ? (
              <span className="font-medium text-foreground">{c.label}</span>
            ) : (
              <Link
                to={c.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {c.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
