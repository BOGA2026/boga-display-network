/**
 * states.tsx — Estados compartidos de carga, vacío y error.
 *
 * Regla del producto: un spinner solo es aceptable dentro de un botón mientras
 * procesa una acción. Nunca como estado de carga de una vista. Para vistas se
 * usan skeletons con las MISMAS dimensiones que el contenido final, para que la
 * página no salte cuando llegan los datos.
 */
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { COPY } from "@/config/lexicon";
import { cn } from "@/lib/utils";

/* ────────────────────────────── Skeletons ────────────────────────────── */

/** Tarjeta individual con preview 16:9 + dos líneas de texto. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/30 bg-card/40",
        className,
      )}
    >
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

/**
 * Grilla de tarjetas. Replica la grilla real de Pantallas / Contenido / Listas.
 * `columns` acepta la misma cantidad de columnas del grid destino.
 */
export function CardGridSkeleton({
  count = 8,
  columns = 4,
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("grid gap-5", cols, className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
      <span className="sr-only">{COPY.loading.generic}</span>
    </div>
  );
}

/** KPI individual: etiqueta + cifra grande. */
export function KpiSkeleton() {
  return (
    <Card className="surface-elevated border-border/30">
      <CardHeader className="pb-2">
        <Skeleton className="h-3 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

/** Fila de KPIs (Suscripción, Analíticas). */
export function KpiGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}

/** Tabla: encabezado + filas con la misma altura que una fila real (h-12). */
export function TableSkeleton({
  rows = 6,
  columns = 4,
  showHeader = true,
  className,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      className={cn(
        "overflow-hidden rounded-xl border border-border/30 bg-card/40",
        className,
      )}
    >
      {showHeader && (
        <div
          className="flex h-11 items-center gap-4 border-b border-border/30 px-4"
          style={{ ["--cols" as string]: columns }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex h-12 items-center gap-4 border-b border-border/20 px-4 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4 flex-1", c === 0 && "max-w-[45%]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Bloque genérico para gráficos u otros contenedores altos. */
export function BlockSkeleton({
  height = 340,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <Skeleton
      aria-busy="true"
      className={cn("w-full rounded-2xl", className)}
      style={{ height }}
    />
  );
}

/* ─────────────────────────── Vacío y error ─────────────────────────── */

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className,
      )}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
        {icon ?? <Inbox className="h-9 w-9" />}
      </div>
      <h2 className="font-display text-xl font-bold mb-2">{title}</h2>
      {description && (
        <p className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = COPY.error.title,
  description = COPY.error.description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className,
      )}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-9 w-9" />
      </div>
      <h2 className="font-display text-xl font-bold mb-2">{title}</h2>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {COPY.actions.retry}
        </Button>
      )}
    </div>
  );
}
