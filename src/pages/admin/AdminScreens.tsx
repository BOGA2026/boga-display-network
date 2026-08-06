import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Monitor, Wifi, WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { fetchWithRetry } from "@/lib/adminFetch";
import { AdminTableSkeleton, AdminInlineError } from "@/components/admin/AdminSkeletons";

type Screen = {
  id: string;
  name: string;
  status: string;
  last_seen_at: string | null;
  last_sync_at: string | null;
  location_id: string;
  locations?: { name: string; business_id: string; businesses?: { name: string } | null } | null;
};

const ONLINE_WINDOW_MS = 3 * 60 * 1000; // 3 min
const SCREENS_SELECT =
  "id,name,status,last_seen_at,last_sync_at,location_id,locations(name,business_id,businesses(name))";

function isOnline(s: Screen) {
  const last = s.last_seen_at ? new Date(s.last_seen_at).getTime() : 0;
  return Date.now() - last <= ONLINE_WINDOW_MS;
}

async function fetchScreens(): Promise<Screen[]> {
  return fetchWithRetry(
    async () => {
      const { data, error, status } = await supabase
        .from("screens")
        .select(SCREENS_SELECT)
        .order("last_seen_at", { ascending: false, nullsFirst: false });
      if (error) throw Object.assign(new Error(error.message), { status: status ?? 500 });
      return (data as any) ?? [];
    },
    { label: "admin-screens", timeoutMs: 10000, retries: 2 }
  );
}

export default function AdminScreens() {
  const {
    data: screens = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "screens"],
    queryFn: fetchScreens,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [tick, setTick] = useState(0);
  const reconnectRef = useRef<number | null>(null);

  useEffect(() => {
    const attach = () => {
      const channel = supabase
        .channel("admin-screens")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "screens" }, () => refetch())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "screens" }, () => refetch())
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
            reconnectRef.current = window.setTimeout(() => {
              supabase.removeChannel(channel);
              current = attach();
            }, 2000);
          }
        });
      return channel;
    };
    let current = attach();

    const onVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", () => refetch());

    const t = window.setInterval(() => setTick((x) => x + 1), 30_000);

    return () => {
      supabase.removeChannel(current);
      document.removeEventListener("visibilitychange", onVisibility);
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      window.clearInterval(t);
    };
  }, [refetch]);

  const online = useMemo(() => screens.filter(isOnline).length, [screens, tick]);
  const offline = screens.length - online;

  const filtered = screens.filter(s => {
    const q = search.toLowerCase();
    if (q) {
      const hay = `${s.name} ${s.locations?.name ?? ""} ${s.locations?.businesses?.name ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter === "online" && !isOnline(s)) return false;
    if (statusFilter === "offline" && isOnline(s)) return false;
    return true;
  });

  // Group by business
  const byBusiness = useMemo(() => {
    const map = new Map<string, { name: string; screens: Screen[] }>();
    for (const s of filtered) {
      const bId = s.locations?.business_id ?? "sin-negocio";
      const bName = s.locations?.businesses?.name ?? "Sin negocio";
      if (!map.has(bId)) map.set(bId, { name: bName, screens: [] });
      map.get(bId)!.screens.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].screens.length - a[1].screens.length);
  }, [filtered]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pantallas activas por usuario</h1>
          <p className="text-sm text-muted-foreground">Estado en tiempo real • ventana online: 3 min</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" /> <span className="font-semibold text-emerald-400">{online}</span> online
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs">
            <WifiOff className="h-3.5 w-3.5 text-red-400" /> <span className="font-semibold text-red-400">{offline}</span> offline
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Buscar pantalla, ubicación o negocio..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md bg-background/60" />
        <div className="flex gap-1 rounded-md border border-border/50 bg-background/40 p-1">
          {(["all", "online", "offline"] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 text-xs rounded ${statusFilter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f === "all" ? "Todos" : f === "online" ? "Online" : "Offline"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <AdminInlineError
          message={(error as Error)?.message ?? "No se pudo cargar la lista de pantallas."}
          onRetry={() => refetch()}
        />
      )}

      {isLoading && screens.length === 0 ? (
        <Card className="bg-background/40 border-border/50 overflow-hidden p-0">
          <AdminTableSkeleton rows={6} cols={5} />
        </Card>
      ) : screens.length === 0 && !error ? (
        <Card className="p-10 text-center bg-background/40 border-border/50">
          <Monitor className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <div className="text-sm text-muted-foreground">Sin pantallas registradas</div>
        </Card>
      ) : byBusiness.length === 0 ? (
        <Card className="p-10 text-center bg-background/40 border-border/50">
          <Monitor className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <div className="text-sm text-muted-foreground">Sin pantallas registradas</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {byBusiness.map(([bId, { name, screens: bs }]) => (
            <Card key={bId} className="bg-background/40 border-border/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
                <span className="font-semibold text-sm">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {byBusinessStats.get(bId)?.screens_online ?? bs.filter(isOnline).length}/
                  {byBusinessStats.get(bId)?.screens_total ?? bs.length} online
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/30">
                    <tr>
                      <th className="text-left px-4 py-2">Pantalla</th>
                      <th className="text-left px-4 py-2">Ubicación</th>
                      <th className="text-left px-4 py-2">Estado</th>
                      <th className="text-left px-4 py-2">Última conexión</th>
                      <th className="text-left px-4 py-2">Último sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bs.map(s => {
                      const on = isOnline(s);
                      return (
                        <tr key={s.id} className="border-b border-border/20 hover:bg-white/5">
                          <td className="px-4 py-2 font-medium">{s.name}</td>
                          <td className="px-4 py-2 text-muted-foreground">{s.locations?.name ?? "—"}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`v-dot ${on ? "v-dot-live" : "v-dot-error"}`} />
                              <span className={on ? "text-emerald-400" : "text-red-400"}>{on ? "Online" : "Offline"}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {s.last_seen_at ? formatDistanceToNow(new Date(s.last_seen_at), { addSuffix: true, locale: es }) : "Nunca"}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {s.last_sync_at ? formatDistanceToNow(new Date(s.last_sync_at), { addSuffix: true, locale: es }) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
