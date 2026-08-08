/**
 * MapView — mapa de monitoreo con Leaflet.
 *
 * Se migró de Mapbox GL a Leaflet: solo necesitamos pines con estado y un popup,
 * y Mapbox GL costaba ~500 kB gzip + un token facturable. Leaflet ya se usa en
 * el mapa de Sedes, así que además compartimos dependencia y estilos.
 *
 * Notas Vite:
 *  - `leaflet/dist/leaflet.css` se importa explícitamente (si no, el mapa se descuadra).
 *  - Usamos `L.divIcon` (HTML/CSS) en vez de `L.Icon.Default`: evita el problema de
 *    rutas relativas a las imágenes y nos deja colorear el pin según el estado.
 */
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { LastSyncLabel } from "@/components/system/LastSyncLabel";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMonitoringStore, useMonitoredDevices } from "./store";
import { MapPin } from "lucide-react";

const HOUR = 60 * 60 * 1000;

type PinStatus = "online" | "warn" | "down";

const PIN_COLOR: Record<PinStatus, string> = {
  online: "#22c55e", // en línea
  warn: "#f59e0b", // +2 h sin reportar
  down: "#ef4444", // +48 h o nunca
};

const PIN_LABEL: Record<PinStatus, string> = {
  online: "En línea",
  warn: "Sin reportar hace más de 2 h",
  down: "Fuera de línea",
};

function pinStatus(lastSeenAt: string | null, status: string): PinStatus {
  if (!lastSeenAt) return "down";
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  if (elapsed > 48 * HOUR) return "down";
  if (elapsed > 2 * HOUR) return "warn";
  return status === "online" || status === "syncing" ? "online" : "warn";
}

function formatLastSeen(lastSeenAt: string | null) {
  if (!lastSeenAt) return "Nunca se ha conectado";
  const d = new Date(lastSeenAt);
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const iconCache = new Map<PinStatus, L.DivIcon>();

function pinIcon(status: PinStatus) {
  const cached = iconCache.get(status);
  if (cached) return cached;
  const color = PIN_COLOR[status];
  const halo = `${color}33`; /* 20% opacity */
  const icon = L.divIcon({
    className: "",
    html: `<span style="display:block;width:12px;height:12px;border-radius:9999px;background:${color};border:2px solid hsl(var(--background));box-shadow:0 0 0 4px ${halo},0 1px 4px rgba(0,0,0,0.4);"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
  iconCache.set(status, icon);
  return icon;
}

/** Ajusta el encuadre a los pines con padding de 40px. Con un solo punto, centra con zoom 15. */
function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  const signature = points.map((p) => p.join(",")).join("|");

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, map]);

  return null;
}


export default function MapView() {
  const devices = useMonitoredDevices();
  const select = useMonitoringStore((s) => s.select);
  const tick = useMonitoringStore((s) => s.tick);

  const pins = useMemo(
    () =>
      devices
        .filter((d) => d.latitude != null && d.longitude != null)
        .map((d) => ({
          id: d.id,
          screenId: d.screen_id,
          name: d.screen_name ?? "Pantalla sin nombre",
          address: d.address,
          lastSeenAt: d.last_seen_at,
          position: [d.latitude!, d.longitude!] as [number, number],
          status: pinStatus(d.last_seen_at, d.status),
        })),
    // `tick` fuerza el recálculo de estado cuando llegan heartbeats
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [devices, tick]
  );

  if (pins.length === 0) {
    return (
      <div className="v-card flex h-full min-h-[420px] items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-3">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Todavía no hay pantallas ubicadas</h3>
          <p className="text-sm text-muted-foreground">
            Agrega la dirección de cada sede para ver tus pantallas en el mapa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="v-card h-full min-h-[420px] w-full overflow-hidden">
      <MapContainer
        center={pins[0].position}
        zoom={pins.length === 1 ? 15 : 5}
        className="v-map"
        style={{ height: "100%", width: "100%", minHeight: 420 }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <FitToMarkers points={pins.map((p) => p.position)} />

        {pins.map((p) => (
          <Marker
            key={p.id}
            position={p.position}
            icon={pinIcon(p.status)}
            eventHandlers={{ click: () => select(p.id) }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs opacity-70">{p.address ?? "Sede sin dirección"}</div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: PIN_COLOR[p.status],
                      display: "inline-block",
                    }}
                  />
                  {PIN_LABEL[p.status]}
                </div>
                <div className="text-xs opacity-70">
                  Última conexión:{" "}
                  {p.lastSeenAt ? formatLastSeen(p.lastSeenAt) : null}
                  {p.lastSeenAt ? " · " : " "}
                  <LastSyncLabel lastSeenAt={p.lastSeenAt} />
                </div>
                {p.screenId && (
                  <Link
                    to={`/dashboard/pantallas/${p.screenId}`}
                    className="inline-block pt-1 text-xs font-medium underline"
                  >
                    Ver detalle de la pantalla
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
