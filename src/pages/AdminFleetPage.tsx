import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Monitor, Wifi, WifiOff, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface FleetScreen {
  id: string;
  name: string;
  status: string;
  app_version: string | null;
  device_model: string | null;
  os_version: string | null;
  ip_address: string | null;
  last_seen_at: string | null;
  location: { name: string; business: { name: string } | null } | null;
}

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 min
const LATEST_VERSION = "1.0.0"; // actualizar al lanzar nueva APK

const AdminFleetPage = () => {
  const [screens, setScreens] = useState<FleetScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("screens")
      .select(`
        id, name, status, app_version, device_model, os_version, ip_address, last_seen_at,
        location:locations(name, business:businesses(name))
      `)
      .order("last_seen_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[fleet] error", error);
    } else {
      setScreens((data ?? []) as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
  };

  const filtered = useMemo(() => {
    return screens.filter((s) => {
      const online = isOnline(s.last_seen_at);
      if (statusFilter === "online" && !online) return false;
      if (statusFilter === "offline" && online) return false;
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.location?.name?.toLowerCase().includes(q) ||
        s.location?.business?.name?.toLowerCase().includes(q) ||
        s.app_version?.toLowerCase().includes(q)
      );
    });
  }, [screens, filter, statusFilter]);

  const stats = useMemo(() => {
    const online = screens.filter((s) => isOnline(s.last_seen_at)).length;
    const outdated = screens.filter(
      (s) => s.app_version && s.app_version !== LATEST_VERSION
    ).length;
    return { total: screens.length, online, offline: screens.length - online, outdated };
  }, [screens]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            Flota Fire TV
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vista global de todas las pantallas de la plataforma. Actualiza cada 30s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total pantallas</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 border-green-500/30">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Wifi className="h-3 w-3 text-green-500" /> Online
          </div>
          <div className="text-2xl font-bold mt-1 text-green-500">{stats.online}</div>
        </Card>
        <Card className="p-4 border-red-500/30">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <WifiOff className="h-3 w-3 text-red-500" /> Offline
          </div>
          <div className="text-2xl font-bold mt-1 text-red-500">{stats.offline}</div>
        </Card>
        <Card className="p-4 border-yellow-500/30">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" /> Desactualizadas
          </div>
          <div className="text-2xl font-bold mt-1 text-yellow-500">{stats.outdated}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nombre, cliente, sede, versión…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          Todas
        </Button>
        <Button
          variant={statusFilter === "online" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("online")}
        >
          Online
        </Button>
        <Button
          variant={statusFilter === "offline" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("offline")}
        >
          Offline
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Pantalla</TableHead>
              <TableHead>Cliente / Sede</TableHead>
              <TableHead>Versión APK</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Último ping</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Cargando flota…
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay pantallas que coincidan.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => {
              const online = isOnline(s.last_seen_at);
              const outdated = s.app_version && s.app_version !== LATEST_VERSION;
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    {online ? (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                        <Wifi className="h-3 w-3 mr-1" /> Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500 border-red-500/30">
                        <WifiOff className="h-3 w-3 mr-1" /> Offline
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{s.location?.business?.name ?? "—"}</div>
                    <div className="text-muted-foreground text-xs">{s.location?.name ?? "—"}</div>
                  </TableCell>
                  <TableCell>
                    {s.app_version ? (
                      <Badge variant={outdated ? "destructive" : "secondary"}>
                        v{s.app_version}
                        {outdated && <AlertTriangle className="h-3 w-3 ml-1" />}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.device_model ?? "—"}
                    {s.os_version && (
                      <div className="text-xs">Fire OS {s.os_version}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {s.ip_address ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.last_seen_at
                      ? formatDistanceToNow(new Date(s.last_seen_at), {
                          addSuffix: true,
                          locale: es,
                        })
                      : "Nunca"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminFleetPage;
