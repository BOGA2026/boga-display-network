import { lazy, Suspense, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useBusinessId } from "@/hooks/useScheduleData";
import { useDeviceMonitoring } from "@/features/monitoring/useDeviceMonitoring";
import { useMonitoringStore, useStatusCounts, useMonitoredDevices } from "@/features/monitoring/store";
import DeferredMount from "@/components/system/DeferredMount";
import DeviceDetailPanel from "@/features/monitoring/DeviceDetailPanel";
import NotificationCenter from "@/features/monitoring/NotificationCenter";
import { Activity, Radio, MapPin } from "lucide-react";
import { NAV } from "@/config/lexicon";

// Leaflet + tiles viven en su propio chunk: se piden después del primer paint,
// así la lista de pantallas se ve de inmediato.
const MapView = lazy(() => import("@/features/monitoring/MapView"));

function MapSkeleton() {
  return (
    <div className="v-card flex h-full min-h-[420px] items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 animate-pulse" /> Cargando mapa…
      </div>
    </div>
  );
}

const DOT: Record<string, string> = {
  online: "bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.55)]",
  syncing: "bg-amber-400",
  offline: "bg-neutral-500",
  pending: "bg-neutral-400",
};

/** Lista de pantallas — se pinta sin esperar al mapa. */
function DeviceList() {
  const devices = useMonitoredDevices();
  const selectedId = useMonitoringStore((s) => s.selectedId);
  const select = useMonitoringStore((s) => s.select);
  if (devices.length === 0) return null;
  return (
    <ul className="v-card max-h-[220px] space-y-1 overflow-auto p-2">
      {devices.map((d) => (
        <li key={d.id}>
          <button
            type="button"
            onClick={() => select(selectedId === d.id ? null : d.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/5 ${
              selectedId === d.id ? "bg-white/10" : ""
            }`}
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[d.status] ?? "bg-neutral-500"}`} />
            <span className="flex-1 truncate">{d.screen_name ?? "Pantalla sin nombre"}</span>
            <span className="truncate text-xs text-muted-foreground">{d.address ?? "Sin dirección"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function KpiCard({ label, value, dotClass }: { label: string; value: number; dotClass: string }) {
  return (
    <div className="v-card flex items-center gap-3 px-4 py-3">
      <span className={`v-dot v-dot-lg ${dotClass}`} />
      <div>
        <div className="v-kpi-value v-kpi-value-sm text-lg leading-none">{value}</div>
        <div className="v-kpi-label">{label}</div>
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
    <div className="v-card flex items-center gap-2 rounded-full px-3 py-1 text-xs">
      <span className={`relative flex h-2 w-2`}>
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${fresh ? "bg-emerald-500 opacity-75 animate-ping" : ""}`}
        />
        <span className={`v-dot ${fresh ? "v-dot-online" : "v-dot-offline"}`} />
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
  const counts = useStatusCounts();
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
              <Radio className="h-5 w-5 text-primary" /> {NAV.monitoreo.pageTitle}
            </h1>
            <p className="text-sm text-muted-foreground">{NAV.monitoreo.pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <LivePulse />
            <NotificationCenter />
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Total" value={counts.total} dotClass="bg-primary" />
          <KpiCard label="En línea" value={counts.online} dotClass="bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.55)]" />
          <KpiCard label="Sincronizando" value={counts.syncing} dotClass="bg-amber-400" />
          <KpiCard label="Desconectadas" value={counts.offline} dotClass="bg-neutral-500" />
          <KpiCard label="Pendientes" value={counts.pending} dotClass="bg-neutral-400" />
        </section>

        <div className={`grid flex-1 min-h-0 gap-4 ${selectedId ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1"}`}>
          <div className="flex min-h-[420px] flex-col gap-3">
            <DeviceList />
            <div className="min-h-[340px] flex-1">
              <DeferredMount minHeight={340} placeholder={<MapSkeleton />}>
                <Suspense fallback={<MapSkeleton />}>
                  <MapView />
                </Suspense>
              </DeferredMount>
            </div>
          </div>
          {selectedId && (
            <div className="min-h-0">
              <DeviceDetailPanel />
            </div>
          )}
        </div>

        {counts.total === 0 && (
          <div className="flex items-center gap-3 v-card p-4 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            Aún no hay pantallas emparejadas. Vincula la primera desde “Pantallas”.
          </div>
        )}
      </div>
    </>
  );
}
