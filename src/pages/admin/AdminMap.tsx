import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as MapIcon, List } from "lucide-react";

const iconCache = new Map<string, L.DivIcon>();

function locationIcon(hasScreens: boolean) {
  const key = hasScreens ? "online" : "unpaired";
  const cached = iconCache.get(key);
  if (cached) return cached;

  const color = hasScreens ? "#22c55e" : "#f59e0b";
  const halo = `${color}33`; /* 20% opacity */
  const icon = L.divIcon({
    className: "",
    html: `<span style="display:block;width:12px;height:12px;border-radius:9999px;background:${color};border:2px solid hsl(var(--admin-bg));box-shadow:0 0 0 4px ${halo},0 1px 4px rgba(0,0,0,0.4);"></span>`,
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

type Loc = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  business_id: string;
  businesses?: { name: string } | null;
  screens?: { id: string }[];
};

export default function AdminMap() {
  const [locations, setLocations] = useState<Loc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "table">("map");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id,name,address,latitude,longitude,business_id,businesses(name),screens(id)");
      if (error) setError(error.message);
      else setLocations((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const withCoords = locations.filter((l) => l.latitude != null && l.longitude != null);
  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of locations) {
      // Derive city from address (last segment) as a rough grouping
      const city = (l.address?.split(",").pop() || "Sin ciudad").trim();
      map.set(city, (map.get(city) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [locations]);

  const center: [number, number] = withCoords.length
    ? [withCoords[0].latitude!, withCoords[0].longitude!]
    : [4.6097, -74.0817]; // Bogotá

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ubicación geográfica</h1>
          <p className="text-sm text-muted-foreground">
            {locations.length} sedes • {withCoords.length} con coordenadas
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border/50 bg-background/40 p-1">
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded ${view === "map" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
          >
            <MapIcon className="h-3.5 w-3.5" /> Mapa
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded ${view === "table" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
          >
            <List className="h-3.5 w-3.5" /> Tabla
          </button>
        </div>
      </div>

      {error && <div className="text-destructive text-sm">Error: {error}</div>}

      {loading ? (
        <Card className="p-10 flex flex-col items-center justify-center gap-3 bg-background/40 border-border/50" style={{ minHeight: 500 }}>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "hsl(var(--admin-accent))" }} />
          <div className="text-sm text-muted-foreground">Cargando ubicaciones…</div>
        </Card>
      ) : locations.length === 0 ? (
        <Card className="p-10 text-center bg-background/40 border-border/50">
          <MapIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <div className="text-sm text-muted-foreground">Aún no hay sedes registradas</div>
        </Card>
      ) : view === "map" ? (
        withCoords.length === 0 ? (
          <Card className="p-10 text-center bg-background/40 border-border/50">
            <MapIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <div className="text-sm text-muted-foreground">Ninguna sede tiene coordenadas registradas todavía</div>
          </Card>
        ) : (
          <Card className="overflow-hidden bg-background/40 border-border/50" style={{ height: 560 }}>
            <MapContainer center={center} zoom={5} className="v-map" style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <FitToMarkers points={withCoords.map((l) => [l.latitude!, l.longitude!])} />
              {withCoords.map((l) => (
                <Marker key={l.id} position={[l.latitude!, l.longitude!]} icon={locationIcon((l.screens?.length ?? 0) > 0)}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{l.name}</div>
                      <div className="text-muted-foreground text-xs">{l.businesses?.name}</div>
                      {l.address && <div className="text-xs mt-1">{l.address}</div>}
                      <div className="text-xs mt-1">{l.screens?.length ?? 0} pantallas</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Card>
        )
      ) : (
        <Card className="bg-background/40 border-border/50">
          <div className="p-3 border-b border-border/50 text-sm font-medium">Sedes por ciudad</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="text-left p-3">Ciudad / zona</th>
                  <th className="text-left p-3">Sedes</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(([city, count]) => (
                  <tr key={city} className="border-b border-border/30 hover:bg-white/5">
                    <td className="p-3">{city}</td>
                    <td className="p-3 font-semibold">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
