import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UsageState } from "./api";

export function UsageCounter({ usage, className }: { usage: UsageState | null; className?: string }) {
  if (!usage) return null;
  const pct = usage.limit === 0 ? 0 : Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const critical = usage.remaining <= 0;
  const low = !critical && usage.remaining <= Math.ceil(usage.limit * 0.1);
  const reset = new Date(usage.resets_at).toLocaleDateString("es-CO", { day: "numeric", month: "long" });

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 backdrop-blur transition-colors",
        critical ? "border-destructive/40 bg-destructive/10" : low ? "border-amber-500/40 bg-amber-500/10" : "border-border/60 bg-card/60",
        className,
      )}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          Generaciones IA este mes
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          <strong className="text-foreground">{usage.used}</strong> / {usage.limit}
        </span>
      </div>
      <Progress value={pct} className={cn("h-2", critical && "[&>div]:bg-destructive", low && !critical && "[&>div]:bg-amber-500")} />
      <p className="mt-2 text-xs text-muted-foreground">
        {critical
          ? `Se renueva el ${reset}. Actualiza tu plan para seguir generando hoy.`
          : low
            ? `Te quedan ${usage.remaining} generaciones. El contador se renueva el ${reset}.`
            : `Te quedan ${usage.remaining} generaciones hasta el ${reset}.`}
      </p>
    </div>
  );
}
