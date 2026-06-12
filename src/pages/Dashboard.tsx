import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Monitor, MonitorOff, MapPin, Image, Zap, TrendingUp, TrendingDown,
  Clock, Plus, Upload, ListVideo, Calendar, Activity, Wifi, WifiOff,
  RefreshCw, PlayCircle, AlertCircle, CheckCircle2, User, Circle, ArrowRight,
  MonitorSmartphone,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { SubscriptionAlerts } from "@/components/dashboard/SubscriptionAlerts";
import { useToast } from "@/hooks/use-toast";

// ─── Data hooks ──────────────────────────────────────────
function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const bizRes = await supabase.rpc("get_user_business_id");
      const businessId = bizRes.data as string | null;
      if (!businessId) return null;

      const [screensRes, locationsRes, contentRes, playlistsRes, devicesRes, subRes, scheduleRes] = await Promise.all([
        supabase.from("screens").select("id, name, status, last_seen_at, location_id, license_status, locations(name)").order("name"),
        supabase.from("locations").select("id, name", { count: "exact", head: true }),
        supabase.from("content").select("id", { count: "exact", head: true }),
        supabase.from("playlists").select("id", { count: "exact", head: true }),
        supabase.from("devices").select("id, status, last_seen_at, screen_name, paired_at").order("last_seen_at", { ascending: false }).limit(10),
        supabase.from("subscriptions").select("status, expires_at, grace_period_ends_at").limit(1).maybeSingle(),
        supabase.from("schedule_blocks").select("id", { count: "exact", head: true }).eq("is_enabled", true),
      ]);

      const screens = screensRes.data || [];
      const online = screens.filter((s) => s.status === "online").length;
      const offline = screens.length - online;
      const lastSync = screens.reduce((latest: string | null, s: any) => {
        if (!s.last_seen_at) return latest;
        if (!latest) return s.last_seen_at;
        return s.last_seen_at > latest ? s.last_seen_at : latest;
      }, null);

      return {
        businessId,
        screens,
        totalScreens: screens.length,
        online,
        offline,
        locations: locationsRes.count || 0,
        content: contentRes.count || 0,
        playlists: playlistsRes.count || 0,
        schedules: scheduleRes.count || 0,
        devices: devicesRes.data || [],
        lastSync,
        subscription: subRes.data || null,
      };
    },
    refetchInterval: 30000,
  });
}

// ─── Trend badge ────────────────────────────────────────
const TrendBadge = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  if (value === 0) return null;
  const up = value > 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
      up ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
    )}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {Math.abs(value)}{suffix}
    </span>
  );
};

// ─── KPI Card ───────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
  trend?: number;
  status?: "ok" | "warn" | "error";
  subtitle?: string;
  delay?: number;
}

const KpiCard = ({ label, value, icon: Icon, accent, trend, status, subtitle, delay = 0 }: KpiProps) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Card className={cn(
      "surface-elevated border-border/30 transition-all duration-500 hover:border-primary/40 hover:-translate-y-0.5 group",
      accent && "glow-primary-sm",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend !== undefined && <TrendBadge value={trend} suffix="%" />}
            </div>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
            accent ? "gradient-primary glow-primary-sm" : "bg-secondary"
          )}>
            <Icon className={cn("h-5 w-5", accent ? "text-primary-foreground" : "text-muted-foreground")} />
          </div>
        </div>
        {status && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "ok" ? "bg-primary" : status === "warn" ? "bg-accent" : "bg-destructive"
            )} />
            <span className="text-[10px] text-muted-foreground">
              {status === "ok" ? "Operativo" : status === "warn" ? "Alerta" : "Inactivo"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Quick Actions ──────────────────────────────────────
const quickActions = [
  { label: "Agregar pantalla", icon: Plus, path: "/dashboard/pantallas" },
  { label: "Subir contenido", icon: Upload, path: "/dashboard/contenido" },
  { label: "Crear playlist", icon: ListVideo, path: "/dashboard/playlists" },
  { label: "Programar contenido", icon: Calendar, path: "/dashboard/programacion" },
];

// ─── Activity types ─────────────────────────────────────
function generateActivity(devices: any[], screens: any[]) {
  const items: { icon: React.ElementType; text: string; time: string; type: string }[] = [];

  devices.forEach((d: any) => {
    if (d.paired_at) {
      items.push({
        icon: CheckCircle2,
        text: `Dispositivo "${d.screen_name || "—"}" emparejado`,
        time: d.paired_at,
        type: "success",
      });
    }
    if (d.status === "pending") {
      items.push({
        icon: AlertCircle,
        text: `Dispositivo pendiente de emparejamiento`,
        time: d.last_seen_at || "",
        type: "warn",
      });
    }
  });

  screens.forEach((s: any) => {
    if (s.status === "online" && s.last_seen_at) {
      items.push({
        icon: Wifi,
        text: `"${s.name}" reportó conexión`,
        time: s.last_seen_at,
        type: "info",
      });
    }
    if (s.status === "offline") {
      items.push({
        icon: WifiOff,
        text: `"${s.name}" sin conexión`,
        time: s.last_seen_at || "",
        type: "error",
      });
    }
  });

  return items
    .filter((i) => i.time)
    .sort((a, b) => (b.time > a.time ? 1 : -1))
    .slice(0, 8);
}

function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

// ─── Primeros pasos card ────────────────────────────────
interface Step {
  label: string;
  path: string;
  done: boolean;
}

function PrimerosPasosCard({ steps, onDismiss }: { steps: Step[]; onDismiss?: () => void }) {
  const allDone = steps.every((s) => s.done);
  const completedCount = steps.filter((s) => s.done).length;

  if (allDone && onDismiss) {
    onDismiss();
    return null;
  }

  return (
    <Card className="surface-elevated border-border/30 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-base">Primeros pasos</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completa estos pasos para poner tu cartelería digital en marcha
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow-primary-sm">
            <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </CardHeader>
      <Separator className="mx-4 bg-border/30" />
      <CardContent className="pt-3">
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-all duration-300",
                step.done
                  ? "border-primary/20 bg-primary/5"
                  : "border-border/30 bg-secondary/30 hover:border-primary/30"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                  step.done ? "bg-primary" : "border border-muted-foreground/30"
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <span className="text-[11px] font-semibold text-muted-foreground">{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done && "text-muted-foreground line-through"
                  )}
                >
                  {step.label}
                </p>
              </div>
              {!step.done && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary text-xs"
                  asChild
                >
                  <Link to={step.path}>
                    Ir
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {completedCount}/{steps.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard ──────────────────────────────────────────
const Dashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const [primerosPasosDismissed, setPrimerosPasosDismissed] = useState(false);

  const activity = stats ? generateActivity(stats.devices, stats.screens) : [];
  const systemStatus = stats
    ? stats.offline === 0 && stats.totalScreens > 0
      ? "ok"
      : stats.offline > 0
      ? "warn"
      : undefined
    : undefined;

  const steps: Step[] = stats
    ? [
        { label: "Conecta tu primera pantalla", path: "/dashboard/pantallas", done: stats.totalScreens > 0 },
        { label: "Agrega tu primer contenido", path: "/dashboard/contenido", done: stats.content > 0 },
        { label: "Programa qué mostrar", path: "/dashboard/programacion", done: stats.schedules > 0 },
      ]
    : [];

  const showPrimerosPasos =
    !isLoading &&
    !primerosPasosDismissed &&
    stats &&
    (stats.totalScreens === 0 || stats.content === 0 || stats.schedules === 0);

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Panel de control</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Resumen general de tu red de señalización digital
          </p>
        </div>
        {stats?.lastSync && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            Última sincronización: {timeAgo(stats.lastSync)}
          </div>
        )}
      </div>

      <Separator className="bg-border/40" />

      {/* Primeros pasos */}
      {showPrimerosPasos && (
        <PrimerosPasosCard
          steps={steps}
          onDismiss={() => setPrimerosPasosDismissed(true)}
        />
      )}

      {/* Subscription Alerts */}
      {stats?.subscription && (
        <SubscriptionAlerts
          expiresAt={stats.subscription.expires_at}
          gracePeriodEndsAt={stats.subscription.grace_period_ends_at}
          status={stats.subscription.status}
        />
      )}

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Pantallas" value={stats?.totalScreens ?? 0} icon={Monitor} accent trend={0} delay={0} />
          <KpiCard label="En línea" value={stats?.online ?? 0} icon={Zap} status={stats?.online ? "ok" : undefined} delay={50} />
          <KpiCard label="Fuera de línea" value={stats?.offline ?? 0} icon={MonitorOff} status={stats?.offline ? "error" : undefined} delay={100} />
          <KpiCard label="Ubicaciones" value={stats?.locations ?? 0} icon={MapPin} delay={150} />
          <KpiCard label="Contenido" value={stats?.content ?? 0} icon={Image} delay={200} />
          <KpiCard label="Playlists" value={stats?.playlists ?? 0} icon={PlayCircle} delay={250} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickActions.map((a, i) => (
          <Button
            key={a.label}
            variant="outline"
            className={cn(
              "h-auto flex-col gap-2 py-4 border-border/40 bg-card hover:border-primary/40 hover:bg-secondary/80 transition-all duration-300",
              "opacity-0 animate-fade-in"
            )}
            style={{ animationDelay: `${300 + i * 60}ms`, animationFillMode: "forwards" }}
            asChild
          >
            <Link to={a.path}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-primary-sm">
                <a.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xs font-medium">{a.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Activity + Screen status */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Activity feed */}
        <Card className="surface-elevated border-border/30 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base">Actividad del sistema</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <Separator className="mx-4 bg-border/30" />
          <CardContent className="pt-3">
            {activity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Sin actividad reciente"
                description="La actividad aparecerá cuando agregues pantallas y contenido."
                action={{ label: "Agregar pantalla", path: "/dashboard/pantallas" }}
              />
            ) : (
              <div className="space-y-0">
                {activity.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2.5 border-b border-border/20 last:border-0 animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: "forwards" }}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                      item.type === "success" ? "bg-primary/15" :
                      item.type === "error" ? "bg-destructive/15" :
                      item.type === "warn" ? "bg-accent/15" : "bg-secondary"
                    )}>
                      <item.icon className={cn(
                        "h-3 w-3",
                        item.type === "success" ? "text-primary" :
                        item.type === "error" ? "text-destructive" :
                        item.type === "warn" ? "text-accent" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug">{item.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Screen status */}
        <Card className="surface-elevated border-border/30 lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base">Estado de pantallas</CardTitle>
              {systemStatus && (
                <span className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  systemStatus === "ok" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                )}>
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    systemStatus === "ok" ? "bg-primary" : "bg-accent"
                  )} />
                  {systemStatus === "ok" ? "Todo operativo" : "Requiere atención"}
                </span>
              )}
            </div>
          </CardHeader>
          <Separator className="mx-4 bg-border/30" />
          <CardContent className="pt-3">
            {!stats?.screens.length ? (
              <EmptyState
                icon={Monitor}
                title="No hay pantallas registradas"
                description="Conecta tu primera pantalla para comenzar a mostrar contenido."
                action={{ label: "Agregar primera pantalla", path: "/dashboard/pantallas" }}
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {stats.screens.map((screen: any, i: number) => {
                  const licenseStatus = screen.license_status || "active";
                  const statusColor = licenseStatus === "active" 
                    ? screen.status === "online" ? "bg-primary" : "bg-muted-foreground/40"
                    : licenseStatus === "suspended" ? "bg-destructive" 
                    : "bg-yellow-500";
                  const badgeClass = licenseStatus === "suspended"
                    ? "bg-destructive/15 text-destructive"
                    : licenseStatus === "pending" 
                    ? "bg-yellow-500/15 text-yellow-400"
                    : screen.status === "online"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground";
                  const badgeLabel = licenseStatus === "suspended"
                    ? "Suscripción vencida"
                    : licenseStatus === "pending"
                    ? "Pendiente"
                    : screen.status === "online" ? "En línea" : "Offline";

                  return (
                  <div
                    key={screen.id}
                    className="flex items-center gap-3 rounded-lg border border-border/30 bg-secondary/30 p-3 transition-all hover:border-primary/30 animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: "forwards" }}
                  >
                    <div className="relative">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <span className={cn(
                        "absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-card",
                        statusColor
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{screen.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {screen.locations?.name && <span>{screen.locations.name}</span>}
                        {screen.last_seen_at && (
                          <>
                            <span>·</span>
                            <span>{timeAgo(screen.last_seen_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                      badgeClass
                    )}>
                      {badgeLabel}
                    </span>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─── Empty state component ──────────────────────────────
function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; path: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">{description}</p>
      {action && (
        <Button size="sm" className="mt-4 gradient-primary text-primary-foreground glow-primary-sm" asChild>
          <Link to={action.path}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  );
}

export default Dashboard;
