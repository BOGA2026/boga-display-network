import { useQuery } from "@tanstack/react-query";
import { fetchOfflineEvents } from "./api";
import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle } from "lucide-react";

function formatRange(start: string, end: string | null) {
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const fmt = (d: Date) =>
    d.toLocaleString("es-CO", { weekday: "short", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  return e ? `${fmt(s)} → ${fmt(e)}` : `${fmt(s)} → en curso`;
}

export default function OfflineHistory({ deviceId }: { deviceId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["offline-events", deviceId],
    queryFn: () => fetchOfflineEvents(deviceId, 20),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">Cargando historial…</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
        Sin caídas registradas. La pantalla ha estado estable.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-medium">Historial de caídas</div>
      <ul className="divide-y divide-white/5">
        {data.map((ev) => {
          const durationSec =
            ev.duration_seconds ??
            Math.max(0, Math.floor(((ev.came_online_at ? new Date(ev.came_online_at).getTime() : Date.now()) - new Date(ev.went_offline_at).getTime()) / 1000));
          const dur = formatDistanceStrict(0, durationSec * 1000, { locale: es });
          return (
            <li key={ev.id} className="flex items-start gap-3 px-4 py-3 text-sm">
              <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${ev.came_online_at ? "text-amber-400" : "text-red-500"}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate">{formatRange(ev.went_offline_at, ev.came_online_at)}</div>
                <div className="text-xs text-muted-foreground">Duración: {dur}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
