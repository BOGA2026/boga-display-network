import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowLeft,
  Replace,
  MapPin,
  Pencil,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { mockScreens, type ScreenData } from "@/data/mockScreens";
import { supabase } from "@/integrations/supabase/client";
import ScreenDetailKpis from "@/components/digital-signage/ScreenDetailKpis";
import ScreenPreview from "@/components/digital-signage/ScreenPreview";
import ScreenTimeline from "@/components/digital-signage/ScreenTimeline";
import ScreenSettingsPanel from "@/components/digital-signage/ScreenSettingsPanel";
import AssignPlaylistDialog from "@/components/digital-signage/AssignPlaylistDialog";
import LocationEditorDialog from "@/components/digital-signage/LocationEditorDialog";
import RemoteActionsPanel from "@/components/digital-signage/RemoteActionsPanel";
import { getScreenHealth, formatLastSeen } from "@/lib/screen-health";

interface DeviceInfo {
  appVersion: string | null;
  deviceModel: string | null;
  osVersion: string | null;
  ipAddress: string | null;
}

type LocationSource = "gps" | "manual" | "ip" | "none";

interface EffectiveLocation {
  lat: number;
  lng: number;
  label: string;
  source: LocationSource;
  accuracy?: number | null;
}

function resolveLocation(dbScreen: any, loc: any): EffectiveLocation {
  // 1. GPS from device (highest priority)
  if (typeof dbScreen?.gps_lat === "number" && typeof dbScreen?.gps_lng === "number") {
    return {
      lat: dbScreen.gps_lat,
      lng: dbScreen.gps_lng,
      label: loc?.name || "Ubicación del dispositivo",
      source: "gps",
      accuracy: dbScreen.gps_accuracy ?? null,
    };
  }
  // 2. Manual location
  if (typeof loc?.latitude === "number" && typeof loc?.longitude === "number") {
    return {
      lat: loc.latitude,
      lng: loc.longitude,
      label: loc.name || "Ubicación asignada",
      source: "manual",
    };
  }
  // 3. Approximate by IP
  if (typeof dbScreen?.ip_lat === "number" && typeof dbScreen?.ip_lng === "number") {
    const parts = [dbScreen.ip_city, dbScreen.ip_region, dbScreen.ip_country].filter(Boolean);
    return {
      lat: dbScreen.ip_lat,
      lng: dbScreen.ip_lng,
      label: parts.join(", ") || "Aproximada por IP",
      source: "ip",
    };
  }
  return { lat: 0, lng: 0, label: loc?.name || "Sin ubicación", source: "none" };
}

function mapDbScreenToScreenData(dbScreen: any, effective: EffectiveLocation): ScreenData {
  return {
    id: dbScreen.id,
    name: dbScreen.name,
    status: (dbScreen.status === "online" ? "online" : "offline") as ScreenData["status"],
    lastSyncAt: dbScreen.last_seen_at || dbScreen.created_at,
    location: {
      lat: effective.lat,
      lng: effective.lng,
      label: effective.label,
    },
    storageUsedGb: 0,
    storageTotalGb: 8,
    volume: 50,
    brightness: 70,
    adaptiveBrightness: false,
    sleepMode: false,
    autoReboot: false,
    timezone: "America/Bogota",
    orientation: "landscape",
    displayMode: "fill",
    rotation: ((dbScreen.rotation ?? 0) as 0 | 90 | 180 | 270),
    tags: [],
    currentContent: {
      assetName: "Sin contenido",
      thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      aspectRatio: "16:9",
    },
    schedule: [],
  };
}


export default function ScreenDetail() {
  const { screenId } = useParams<{ screenId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState<ScreenData | null>(null);
  const [fromDashboard, setFromDashboard] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [locationEditOpen, setLocationEditOpen] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [locationSource, setLocationSource] = useState<LocationSource>("none");

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    appVersion: null,
    deviceModel: null,
    osVersion: null,
    ipAddress: null,
  });

  useEffect(() => {
    async function load() {
      // Try mock data first
      const mock = mockScreens.find((s) => s.id === screenId);
      if (mock) {
        setScreen(mock);
        setIsLoading(false);
        return;
      }

      // Try Supabase
      setFromDashboard(true);
      const { data: dbScreen } = await supabase
        .from("screens")
        .select("*, locations(id, name, address, latitude, longitude)")
        .eq("id", screenId!)
        .maybeSingle();

      if (dbScreen) {
        const loc = (dbScreen as any).locations;
        setLocationId(loc?.id ?? null);
        setLocationAddress(loc?.address ?? "");
        setDeviceInfo({
          appVersion: (dbScreen as any).app_version ?? null,
          deviceModel: (dbScreen as any).device_model ?? null,
          osVersion: (dbScreen as any).os_version ?? null,
          ipAddress: (dbScreen as any).ip_address ?? null,
        });
        const effective = resolveLocation(dbScreen, loc);
        setLocationSource(effective.source);
        setScreen(mapDbScreenToScreenData(dbScreen, effective));

      }
      setIsLoading(false);
    }
    load();

    // Auto-refresh every 30s to keep health badge and device info fresh
    const interval = window.setInterval(async () => {
      if (!screenId) return;
      const { data } = await supabase
        .from("screens")
        .select("last_seen_at, status, app_version, device_model, os_version, ip_address")
        .eq("id", screenId)
        .maybeSingle();
      if (!data) return;
      setScreen((prev) => prev ? { ...prev, lastSyncAt: (data as any).last_seen_at || prev.lastSyncAt } : prev);
      setDeviceInfo({
        appVersion: (data as any).app_version ?? null,
        deviceModel: (data as any).device_model ?? null,
        osVersion: (data as any).os_version ?? null,
        ipAddress: (data as any).ip_address ?? null,
      });
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [screenId]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <h2 className="text-xl font-bold text-foreground">Pantalla no encontrada</h2>
        <p className="text-sm text-muted-foreground">
          La pantalla que buscas no existe o fue eliminada.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  const health = getScreenHealth(screen.lastSyncAt);
  const backPath = fromDashboard ? "/dashboard/pantallas" : "/digital-signage/screens";

  const handleChange = async (patch: Partial<ScreenData>) => {
    setScreen((prev) => (prev ? { ...prev, ...patch } : prev));

    // Persist rotation to DB so the Fire TV player picks it up on next checkin
    if (patch.rotation !== undefined && fromDashboard && screenId) {
      const { error } = await supabase
        .from("screens")
        .update({ rotation: patch.rotation })
        .eq("id", screenId);
      if (error) {
        toast({
          title: "No se pudo guardar la rotación",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Force the Fire TV to reload immediately so the new rotation is visible
      // without waiting for the next 60s heartbeat.
      const { error: cmdErr } = await supabase
        .from("screen_commands")
        .insert({
          screen_id: screenId,
          command: "RELOAD",
          payload: { rotation: patch.rotation },
          status: "pending",
        });

      toast({
        title: "Rotación guardada",
        description: cmdErr
          ? "Guardada. El Fire TV la aplicará en su próximo chequeo (hasta 60s)."
          : "El Fire TV se recargará en pocos segundos para aplicar el cambio.",
      });
    }
  };

  const handleDelete = () => {
    toast({ title: "Pantalla eliminada", description: `${screen.name} ha sido removida.` });
    navigate(backPath);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb + CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to={backPath}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Pantallas
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground truncate max-w-[200px]">{screen.name}</span>
          <span className={`ml-1 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${health.className}`}>
            <span className={`h-2 w-2 rounded-full ${health.dotClass} ${health.status === "online" ? "animate-pulse" : ""}`} />
            {health.label}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">· {formatLastSeen(screen.lastSyncAt)}</span>
        </div>

        <Button size="sm" className="gap-1.5 gradient-primary" onClick={() => setAssignOpen(true)}>
          <Replace className="h-4 w-4" />
          Reemplazar contenido
        </Button>
      </div>

      {/* KPIs */}
      <ScreenDetailKpis screen={screen} />

      {/* Main + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Location */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Ubicación</h3>
              </div>
              {fromDashboard && locationId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setLocationEditOpen(true)}
                >
                  <Pencil className="h-3 w-3" />
                  Editar ubicación
                </Button>
              )}
            </div>
            {screen.location.lat !== 0 && screen.location.lng !== 0 ? (
              <div className="relative h-48 w-full">
                <iframe
                  title="Ubicación de pantalla"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${screen.location.lng - 0.005}%2C${screen.location.lat - 0.003}%2C${screen.location.lng + 0.005}%2C${screen.location.lat + 0.003}&layer=mapnik&marker=${screen.location.lat}%2C${screen.location.lng}`}
                />
                <div className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-xs text-foreground backdrop-blur-sm">
                  {screen.location.label} · {screen.location.lat.toFixed(4)}, {screen.location.lng.toFixed(4)}
                </div>
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center gap-2 bg-muted/30 text-sm text-muted-foreground">
                <MapPin className="h-6 w-6 text-primary/60" />
                <p>{screen.location.label}</p>
                <p className="text-xs text-muted-foreground/70">Coordenadas no configuradas</p>
                {fromDashboard && locationId && (
                  <Button size="sm" variant="outline" onClick={() => setLocationEditOpen(true)}>
                    <Pencil className="mr-1.5 h-3 w-3" />
                    Configurar ubicación
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <ScreenPreview screen={screen} />

          {/* Timeline */}
          <ScreenTimeline screen={screen} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {fromDashboard && (
            <RemoteActionsPanel screenId={screen.id} screenName={screen.name} />
          )}

          {fromDashboard && (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <Smartphone className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Información del dispositivo</h3>
              </div>
              <dl className="divide-y divide-border text-sm">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-muted-foreground">Modelo</dt>
                  <dd className="font-medium text-foreground">{deviceInfo.deviceModel ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-muted-foreground">Sistema</dt>
                  <dd className="font-medium text-foreground">{deviceInfo.osVersion ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-muted-foreground">Versión app</dt>
                  <dd className="font-mono text-xs font-medium text-foreground">{deviceInfo.appVersion ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-muted-foreground">IP pública</dt>
                  <dd className="font-mono text-xs font-medium text-foreground">{deviceInfo.ipAddress ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-muted-foreground">Última señal</dt>
                  <dd className="font-medium text-foreground">{formatLastSeen(screen.lastSyncAt)}</dd>
                </div>
              </dl>
            </div>
          )}

          <ScreenSettingsPanel
            screen={screen}
            onChange={handleChange}
            onDelete={handleDelete}
            onSyncComplete={(data) => {
              if (data.current_playlist) {
                handleChange({
                  currentContent: {
                    ...screen.currentContent,
                    assetName: data.current_playlist.name,
                  },
                });
              }
            }}
          />
        </div>
      </div>
      {/* Assign Playlist Dialog */}
      <AssignPlaylistDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        screenId={screen.id}
        screenName={screen.name}
      />

      {/* Location Editor Dialog */}
      {locationId && (
        <LocationEditorDialog
          open={locationEditOpen}
          onOpenChange={setLocationEditOpen}
          locationId={locationId}
          initialName={screen.location.label}
          initialAddress={locationAddress}
          initialLat={screen.location.lat || undefined}
          initialLng={screen.location.lng || undefined}
          onSaved={(data) => {
            setLocationAddress(data.address);
            setScreen((prev) =>
              prev
                ? {
                    ...prev,
                    location: {
                      lat: data.latitude,
                      lng: data.longitude,
                      label: data.name,
                    },
                  }
                : prev
            );
          }}
        />
      )}
    </div>
  );
}
