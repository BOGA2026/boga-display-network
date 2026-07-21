/**
 * Breadcrumbs — path-driven trail rendered in the dashboard topbar.
 *
 * Rationale:
 * - Deterministic map keeps labels in one place; new routes just add an
 *   entry here.
 * - Segments after `/dashboard` are joined with a soft chevron and the last
 *   one is emphasized to indicate the current page.
 */
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  dashboard: "Inicio",
  pantallas: "Pantallas",
  contenido: "Contenido",
  playlists: "Listas",
  programacion: "Horarios",
  analiticas: "Analíticas",
  suscripcion: "Suscripción",
  "generar-ia": "Generar con IA",
  editor: "Editor",
  leads: "Leads",
  soporte: "Soporte",
};

export function Breadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean); // ["dashboard","pantallas"]
  if (parts.length === 0) return null;

  const crumbs = parts.map((seg, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = LABELS[seg] ?? seg;
    return { href, label, last: i === parts.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      {crumbs.map((c, i) => (
        <div key={c.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
          {c.last ? (
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
      ))}
    </nav>
  );
}
