import { AlertTriangle } from "lucide-react";
import { syncSeverity } from "@/hooks/useAnalytics";
import { COPY } from "@/config/lexicon";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LastSyncLabelProps {
  lastSeenAt: string | Date | null | undefined;
  /** Prefijo opcional, p. ej. "Última sincronización:" */
  prefix?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Muestra la última conexión de una pantalla con color según severidad.
 * < 2 h neutro · 2-48 h ámbar · > 48 h y "Nunca" rojo, con advertencia.
 */
export function LastSyncLabel({ lastSeenAt, prefix, className, iconClassName }: LastSyncLabelProps) {
  const info = syncSeverity(lastSeenAt);

  const content = (
    <span className={cn("inline-flex items-center gap-1", info.className, className)}>
      {info.warn && (
        <AlertTriangle className={cn("h-3 w-3 shrink-0", iconClassName)} aria-hidden="true" />
      )}
      {prefix ? `${prefix} ` : null}
      {info.label}
    </span>
  );

  if (!info.warn) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{COPY.sync.tooltipWarn}</TooltipContent>
    </Tooltip>
  );
}
