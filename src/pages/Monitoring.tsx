import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useBusinessId } from "@/hooks/useScheduleData";
import { useDeviceMonitoring } from "@/features/monitoring/useDeviceMonitoring";
import { useMonitoringStore, selectStatusCounts } from "@/features/monitoring/store";
import MapView from "@/features/monitoring/MapView";
import DeviceDetailPanel from "@/features/monitoring/DeviceDetailPanel";
import NotificationCenter from "@/features/monitoring/NotificationCenter";
import { Activity, Radio } from "lucide-react";

function KpiCard({ label, value, dotClass }: { label: string; value: number; dotClass: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <div>
        <div className="text-lg font-semibold leading-none">{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

/**
 * Freshness pulse — visible cue that the subscription is alive.
 * Ticks on every store update; if silent > 30 s we dim it.
 */
function LivePulse() {
  const tick = useMonitoringStore((s) => s.tick);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => setLastUpdate(Date.now()), [tick]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const gap = Math.floor((now - lastUpdate) / 1000);
  const fresh = gap < 30;
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
      <span className={`relative flex h-2 w-2`}>
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${fresh ? "bg-emerald-500 opacity-75 animate-ping" : ""}`}
        />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${fresh ? "bg-emerald-500" : "bg-neutral-500"}`} />
      </span>
      <span className="text-muted-foreground">
        {fresh ? `Actualizado hace ${gap}s` : `Sin cambios hace ${gap}s`}
      </span>
    </div>
  );
}

export default function Monitoring() {
  const { data: businessId } = useBusinessId();
  useDeviceMonitoring(businessId);
  const counts = useMonitoringStore(selectStatusCounts);
  const selectedId = useMonitoringStore((s) => s.selectedId);

  return (
    <>
      <Helmet>
        <title>Monitoreo de pantallas · Visualia</title>
      </Helmet>
      <div className="flex h-[calc(100vh-88px)] flex-col gap-4 p-4 md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Radio className="h-5 w-5 text-primary" /> Monitoreo geográfico
            </h1>
            <p className="text-sm text-muted-foreground">Estado casi en tiempo real de todas tus pantallas.</p>
          </div>
          <div className="flex items-center gap-2">
            <LivePulse />
            <NotificationCenter />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiCard label="Total" value={counts.total} dotClass="bg-primary" />
          <KpiCard label="En línea" value={counts.online} dotClass="bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.55)]" />
          <KpiCard label="Sincronizando" value={counts.syncing} dotClass="bg-amber-400" />
          <KpiCard label="Desconectadas" value={counts.offline} dotClass="bg-neutral-500" />
          <KpiCard label="Pendientes" value={counts.pending} dotClass="bg-neutral-400" />
        </section>

        <div className={`grid flex-1 min-h-0 gap-4 ${selectedId ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1"}`}>
          <div className="min-h-[420px]">
            <MapView />
          </div>
          {selectedId && (
            <div className="min-h-0">
              <DeviceDetailPanel />
            </div>
          )}
        </div>

        {counts.total === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            Aún no hay pantallas emparejadas. Vincula la primera desde “Pantallas”.
          </div>
        )}
      </div>
    </>
  );
}
