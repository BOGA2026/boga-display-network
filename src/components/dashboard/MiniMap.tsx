/**
 * MiniMap — small Leaflet map for the Dashboard hub.
 * Renders one pin per location; clicking a pin navigates to /dashboard/mapa
 * (or to a specific screen detail when a locationId has exactly one screen).
 */
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon paths (Vite quirk)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

export function MiniMap({ points, height = 280, className }: Props) {
  const navigate = useNavigate();

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
        center={center}
        zoom={points.length ? 11 : 5}
        style={{ height: "100%", width: "100%", borderRadius: 16 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            eventHandlers={{
              click: () => {
                if (p.screenId) navigate(`/dashboard/pantallas/${p.screenId}`);
                else navigate("/dashboard/mapa");
              },
            }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              <span className="text-xs text-muted-foreground">
                {p.status ?? "sin estado"}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
