/**
 * MiniMap — small Leaflet map for the Dashboard hub.
 * Renders one pin per location; clicking a pin navigates to /dashboard/mapa
 * (or to a specific screen detail when a locationId has exactly one screen).
 */
import { useEffect, useId, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MiniMapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status?: "online" | "offline" | "unpaired";
  screenId?: string;
};

interface Props {
  points: MiniMapPoint[];
  height?: number | string;
  className?: string;
}

const STATUS_COLOR: Record<NonNullable<MiniMapPoint["status"]>, string> = {
  online: "#22c55e",
  offline: "#ef4444",
  unpaired: "#f59e0b",
};

const iconCache = new Map<string, L.DivIcon>();

function pointIcon(status: MiniMapPoint["status"]) {
  const key = status ?? "unpaired";
  const cached = iconCache.get(key);
  if (cached) return cached;

  const color = STATUS_COLOR[key];
  const halo = `${color}33`; /* 20% opacity */
  const icon = L.divIcon({
    className: "",
    html: `<span style="display:block;width:12px;height:12px;border-radius:9999px;background:${color};border:2px solid hsl(var(--background));box-shadow:0 0 0 4px ${halo},0 1px 4px rgba(0,0,0,0.4);"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
  iconCache.set(key, icon);
  return icon;
}

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

export function MiniMap({ points, height = 280, className }: Props) {
  const navigate = useNavigate();
  // Leaflet lanza "Map container is already initialized" si React reutiliza el
  // mismo nodo tras un remount (StrictMode/HMR). Una key estable por instancia
  // fuerza un contenedor nuevo.
  const mapKey = useId();

  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [4.711, -74.0721]; // Bogotá fallback
    const lat = points.reduce((a, p) => a + p.lat, 0) / points.length;
    const lng = points.reduce((a, p) => a + p.lng, 0) / points.length;
    return [lat, lng];
  }, [points]);

  useEffect(() => {
    // ensure leaflet re-measures when height changes
    window.dispatchEvent(new Event("resize"));
  }, []);

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        key={mapKey}
        center={center}
        zoom={points.length ? 11 : 5}
        className="v-map"
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitToMarkers points={points.map((p) => [p.lat, p.lng])} />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={pointIcon(p.status)}
            eventHandlers={{
              click: () => {
                if (p.screenId) navigate(`/dashboard/pantallas/${p.screenId}`);
                else navigate("/dashboard/mapa");
              },
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">{p.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: STATUS_COLOR[p.status ?? "unpaired"],
                      display: "inline-block",
                    }}
                  />
                  {p.status === "online"
                    ? "En línea"
                    : p.status === "offline"
                    ? "Fuera de línea"
                    : "Sin emparejar"}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
