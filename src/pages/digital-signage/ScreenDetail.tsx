import { useEffect, useMemo, useState } from "react";
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
import ScreenDetailKpis from "@/components/digital-signage/ScreenDetailKpis";
import ScreenPreview from "@/components/digital-signage/ScreenPreview";
import ScreenTimeline from "@/components/digital-signage/ScreenTimeline";
import ScreenSettingsPanel from "@/components/digital-signage/ScreenSettingsPanel";

const statusBadge = {
  online: { icon: Wifi, label: "Online", cls: "text-emerald-400 bg-emerald-400/10" },
  offline: { icon: WifiOff, label: "Offline", cls: "text-muted-foreground bg-muted" },
  warning: { icon: AlertTriangle, label: "Warning", cls: "text-amber-400 bg-amber-400/10" },
} as const;

export default function ScreenDetail() {
  const { screenId } = useParams<{ screenId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const initial = useMemo(() => mockScreens.find((s) => s.id === screenId), [screenId]);
  const [screen, setScreen] = useState<ScreenData | null>(initial ?? null);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

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
        <h2 className="text-xl font-bold text-foreground">Screen not found</h2>
        <p className="text-sm text-muted-foreground">
          The screen you're looking for doesn't exist or was deleted.
        </p>
        <Button variant="outline" onClick={() => navigate("/digital-signage/screens")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to screens
        </Button>
      </div>
    );
  }

  const st = statusBadge[screen.status];
  const StatusIcon = st.icon;

  const handleChange = (patch: Partial<ScreenData>) => {
    setScreen((prev) => (prev ? { ...prev, ...patch } : prev));
    // Optimistic – in production this would call an API
  };

  const handleDelete = () => {
    toast({ title: "Screen deleted", description: `${screen.name} has been removed.` });
    navigate("/digital-signage/screens");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb + CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/digital-signage/screens"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Screens
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground truncate max-w-[200px]">{screen.name}</span>
          <span className={`ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
            <StatusIcon className="h-3 w-3" />
            {st.label}
          </span>
        </div>

        <Button size="sm" className="gap-1.5 gradient-primary">
          <Replace className="h-4 w-4" />
          Replace Content
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
              <h3 className="text-sm font-semibold text-foreground">Location</h3>
            </div>
            <div className="flex h-40 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
              <div className="text-center">
                <MapPin className="mx-auto mb-1 h-6 w-6 text-primary/60" />
                <p>{screen.location.label}</p>
                <p className="text-xs">{screen.location.lat.toFixed(4)}, {screen.location.lng.toFixed(4)}</p>
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
        />
      </div>
    </div>
  );
}
