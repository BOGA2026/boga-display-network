/**
 * DashboardMap — /dashboard/mapa
 * Full-height map + filters. Markers navigate back to ScreenDetail.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MiniMap, type MiniMapPoint } from "@/components/dashboard/MiniMap";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Row = {
  id: string;
  name: string;
  status: string;
  location_id: string;
  locations: { id: string; name: string; latitude: number | null; longitude: number | null } | null;
};

export default function DashboardMap() {
  const [rows, setRows] = useState<Row[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("screens")
      .select(
        "id, name, status, location_id, locations!inner(id, name, latitude, longitude)",
      )
      .then(({ data, error }) => {
        if (error) console.error(error);
        setRows((data ?? []) as unknown as Row[]);
        setLoading(false);
      });
  }, []);

  const locations = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => r.locations && map.set(r.locations.id, r.locations.name));
    return Array.from(map.entries());
  }, [rows]);

  const points: MiniMapPoint[] = useMemo(() => {
    return rows
      .filter((r) => r.locations?.latitude && r.locations?.longitude)
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter(
        (r) => locationFilter === "all" || r.location_id === locationFilter,
      )
      .map((r) => ({
        id: r.id,
        name: `${r.name} · ${r.locations?.name ?? ""}`,
        lat: r.locations!.latitude!,
        lng: r.locations!.longitude!,
        status:
          r.status === "online"
            ? "online"
            : r.status === "offline"
              ? "offline"
              : "unpaired",
        screenId: r.id,
      }));
  }, [rows, statusFilter, locationFilter]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mapa de pantallas</h1>
        <p className="text-sm text-muted-foreground">
          Cliqueá un pin para ver el detalle de la pantalla.
        </p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="unpaired">Sin emparejar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sede</Label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {locations.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando mapa…
          </div>
        ) : points.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No hay pantallas con ubicación para los filtros actuales.
          </div>
        ) : (
          <MiniMap points={points} height={520} />
        )}
      </Card>
    </div>
  );
}
