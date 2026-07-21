import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMonitoringStore, selectDevicesArray } from "./store";
import { AlertTriangle } from "lucide-react";

// Prefer Lovable Mapbox connector token; fall back to a user-provided public token.
const MAPBOX_TOKEN =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN as string | undefined) ||
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ||
  "";

const STATUS_COLOR: Record<string, string> = {
  online: "#22c55e",
  offline: "#6b7280",
  syncing: "#f59e0b",
  pending: "#9ca3af",
};

/**
 * Mapbox GL was chosen over Google Maps because:
 *  - Native vector-tile clustering with `cluster: true` (Google requires
 *    a separate marker-clusterer library).
 *  - Custom dark styling aligns with Visualia's premium palette out of the box.
 *  - Cheaper per map load at our expected volumes; no server-side proxy needed
 *    since we render tiles client-side.
 *  - Integrates cleanly with the Lovable Mapbox connector (public token via env).
 */
export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  const devices = useMonitoringStore(selectDevicesArray);
  const select = useMonitoringStore((s) => s.select);
  const selectedId = useMonitoringStore((s) => s.selectedId);
  const tick = useMonitoringStore((s) => s.tick);

  const featureCollection = useMemo(() => {
    const features = devices
      .filter((d) => d.latitude != null && d.longitude != null)
      .map((d) => ({
        type: "Feature" as const,
        properties: { id: d.id, status: d.status, name: d.screen_name ?? "" },
        geometry: { type: "Point" as const, coordinates: [d.longitude!, d.latitude!] },
      }));
    return { type: "FeatureCollection" as const, features };
  }, [devices, tick]);

  // Initialize once
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-74.08, 4.65], // Bogotá default
      zoom: 4.5,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("devices", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 45,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "devices",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#5227FF",
          "circle-opacity": 0.85,
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 30],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-stroke-opacity": 0.15,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "devices",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        },
        paint: { "text-color": "#ffffff" },
      });
      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: "devices",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "status"],
            "online",
            STATUS_COLOR.online,
            "offline",
            STATUS_COLOR.offline,
            "syncing",
            STATUS_COLOR.syncing,
            STATUS_COLOR.pending,
          ],
          "circle-radius": 8,
          "circle-stroke-color": "#0a0a12",
          "circle-stroke-width": 2,
        },
      });

      map.on("click", "unclustered", (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id as string | undefined;
        if (id) select(id);
      });
      map.on("click", "clusters", (e) => {
        const feats = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = feats[0]?.properties?.cluster_id;
        const src = map.getSource("devices") as mapboxgl.GeoJSONSource;
        if (clusterId != null) {
          src.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || zoom == null) return;
            map.easeTo({
              center: (feats[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom,
            });
          });
        }
      });
      map.on("mouseenter", "unclustered", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "unclustered", () => (map.getCanvas().style.cursor = ""));
      map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));

      mapRef.current = map;
      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [select]);

  // Push data updates (throttled at the store level, incremental here)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("devices") as mapboxgl.GeoJSONSource | undefined;
    if (src) src.setData(featureCollection);
  }, [featureCollection, ready]);

  // Fit bounds first time we have data
  const fittedRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || fittedRef.current) return;
    const pts = featureCollection.features;
    if (pts.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    pts.forEach((f) => bounds.extend(f.geometry.coordinates as [number, number]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
    fittedRef.current = true;
  }, [featureCollection, ready]);

  // Highlight selected pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const d = featureCollection.features.find((f) => f.properties.id === selectedId);
    if (d) {
      map.easeTo({ center: d.geometry.coordinates as [number, number], zoom: Math.max(map.getZoom(), 13), duration: 600 });
    }
  }, [selectedId, ready, featureCollection]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="max-w-md space-y-3">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
          <h3 className="text-lg font-semibold">Configura Mapbox para ver el mapa</h3>
          <p className="text-sm text-muted-foreground">
            Conecta la integración de Mapbox en Ajustes → Conectores. Cuando esté enlazada, el token público estará disponible
            como <code className="rounded bg-white/10 px-1 text-xs">VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN</code> y el mapa
            se activará automáticamente.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full min-h-[420px] w-full rounded-2xl overflow-hidden border border-white/10" />;
}
