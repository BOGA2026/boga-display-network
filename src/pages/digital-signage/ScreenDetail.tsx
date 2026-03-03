import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowLeft,
  Wifi,
  WifiOff,
  AlertTriangle,
  Replace,
  MapPin,
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

const statusBadge = {
  online: { icon: Wifi, label: "Online", cls: "text-emerald-400 bg-emerald-400/10" },
  offline: { icon: WifiOff, label: "Offline", cls: "text-muted-foreground bg-muted" },
  warning: { icon: AlertTriangle, label: "Warning", cls: "text-amber-400 bg-amber-400/10" },
} as const;

function mapDbScreenToScreenData(dbScreen: any, locationName?: string): ScreenData {
  return {
    id: dbScreen.id,
    name: dbScreen.name,
    status: (dbScreen.status === "online" ? "online" : "offline") as ScreenData["status"],
    lastSyncAt: dbScreen.last_seen_at || dbScreen.created_at,
    location: {
      lat: 4.711,
      lng: -74.072,
      label: locationName || "Sin ubicación",
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
        .select("*, locations(name)")
        .eq("id", screenId!)
        .maybeSingle();

      if (dbScreen) {
        const locName = (dbScreen as any).locations?.name;
        setScreen(mapDbScreenToScreenData(dbScreen, locName));
      }
      setIsLoading(false);
    }
    load();
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

  const st = statusBadge[screen.status];
  const StatusIcon = st.icon;
  const backPath = fromDashboard ? "/dashboard/pantallas" : "/digital-signage/screens";

  const handleChange = (patch: Partial<ScreenData>) => {
    setScreen((prev) => (prev ? { ...prev, ...patch } : prev));
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
          <span className={`ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
            <StatusIcon className="h-3 w-3" />
            {st.label}
          </span>
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
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Ubicación</h3>
            </div>
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
          </div>

          {/* Preview */}
          <ScreenPreview screen={screen} />

          {/* Timeline */}
          <ScreenTimeline screen={screen} />
        </div>

        {/* Sidebar */}
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
      {/* Assign Playlist Dialog */}
      <AssignPlaylistDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        screenId={screen.id}
        screenName={screen.name}
      />
    </div>
  );
}
