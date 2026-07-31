import { useEffect, useState } from "react";
import { LastSyncLabel } from "@/components/system/LastSyncLabel";
import { useMonitoringStore, selectDevicesArray } from "./store";
import UptimeChart from "./UptimeChart";
import OfflineHistory from "./OfflineHistory";
import { updateDeviceLocation } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, MapPin, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  online: "En línea",
  offline: "Desconectada",
  syncing: "Sincronizando",
  pending: "Pendiente",
};
const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]",
  offline: "bg-neutral-500",
  syncing: "bg-amber-400",
  pending: "bg-neutral-400",
};

export default function DeviceDetailPanel() {
  const selectedId = useMonitoringStore((s) => s.selectedId);
  const select = useMonitoringStore((s) => s.select);
  const device = useMonitoringStore((s) => (s.selectedId ? s.devices[s.selectedId] : undefined));

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [addr, setAddr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device) {
      setLat(device.latitude?.toString() ?? "");
      setLng(device.longitude?.toString() ?? "");
      setAddr(device.address ?? "");
    }
  }, [device?.id]);

  if (!selectedId || !device) return null;

  const save = async () => {
    setSaving(true);
    try {
      const patch: { latitude?: number | null; longitude?: number | null; address?: string | null } = {
        address: addr.trim() || null,
      };
      const la = parseFloat(lat);
      const lo = parseFloat(lng);
      patch.latitude = Number.isFinite(la) ? la : null;
      patch.longitude = Number.isFinite(lo) ? lo : null;
      await updateDeviceLocation(selectedId, patch);
      toast.success("Ubicación actualizada");
    } catch (e) {
      toast.error("No se pudo guardar la ubicación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="v-card flex h-full w-full flex-col overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`v-dot v-dot-lg ${STATUS_DOT[device.status] ?? STATUS_DOT.pending}`} />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{STATUS_LABEL[device.status] ?? device.status}</span>
          </div>
          <h3 className="mt-1 truncate text-base font-semibold">{device.screen_name ?? "Pantalla sin nombre"}</h3>
          <p key={now} className="text-xs"><LastSyncLabel lastSeenAt={device.last_seen_at} prefix="Última señal:" /></p>
        </div>
        <button onClick={() => select(null)} className="rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-muted-foreground">Resolución</span><div>{device.resolution ?? "—"}</div></div>
          <div><span className="text-muted-foreground">Versión</span><div>{device.app_version ?? "—"}</div></div>
          <div><span className="text-muted-foreground">Red</span><div>{device.network_type ?? "—"}</div></div>
          <div><span className="text-muted-foreground">Emparejada</span><div>{device.paired_at ? new Date(device.paired_at).toLocaleDateString("es-CO") : "—"}</div></div>
        </section>

        <UptimeChart deviceId={device.id} />

        <OfflineHistory deviceId={device.id} />

        <section className="v-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4" /> Ubicación</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Latitud</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="4.6534" inputMode="decimal" />
            </div>
            <div>
              <Label className="text-xs">Longitud</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-74.0836" inputMode="decimal" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Dirección legible</Label>
              <Input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Cra 7 # 45-12, Bogotá" />
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />} Guardar ubicación
          </Button>
        </section>
      </div>
    </aside>
  );
}
