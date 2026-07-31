import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUptimeByDay } from "./api";
import { filterQueryOptions } from "@/lib/query-client";
import { BlockSkeleton } from "@/components/feedback/states";
import { Loader2 } from "lucide-react";
import DeferredMount from "@/components/system/DeferredMount";
import ChartSkeleton from "@/components/system/ChartSkeleton";

// recharts vive en su propio chunk: sólo se pide después del primer paint.
const UptimeBars = lazy(() => import("@/features/analytics/charts/UptimeChart"));

export default function UptimeChart({ deviceId, days = 7 }: { deviceId: string; days?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["uptime", deviceId, days],
    queryFn: () => fetchUptimeByDay(deviceId, days),
    ...filterQueryOptions,
  });

  if (isLoading) {
    return <BlockSkeleton height={160} className="rounded-xl" />;
  }

  const rows = (data ?? []).map((d) => ({
    day: d.date.slice(5), // MM-DD
    Encendida: d.onHours,
    Apagada: d.offHours,
  }));

  return (
    <div className="v-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">Horas encendida (últimos {days} días)</h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="v-dot v-dot-online" /> Encendida</span>
          <span className="flex items-center gap-1"><span className="v-dot v-dot-offline" /> Apagada</span>
        </div>
      </div>
      <DeferredMount minHeight={180} placeholder={<ChartSkeleton height={180} label="Cargando gráfico de uptime" />}>
        <Suspense fallback={<ChartSkeleton height={180} />}>
          <UptimeBars rows={rows} height={180} />
        </Suspense>
      </DeferredMount>
    </div>
  );
}
