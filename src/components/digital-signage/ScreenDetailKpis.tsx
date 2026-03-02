import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Wifi, WifiOff, AlertTriangle, HardDrive, Volume2, Globe } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ScreenData } from "@/data/mockScreens";

const statusMap = {
  online: { icon: Wifi, label: "En línea", className: "text-emerald-400" },
  offline: { icon: WifiOff, label: "Desconectada", className: "text-muted-foreground" },
  warning: { icon: AlertTriangle, label: "Advertencia", className: "text-amber-400" },
} as const;

export default function ScreenDetailKpis({ screen }: { screen: ScreenData }) {
  const st = statusMap[screen.status];
  const StatusIcon = st.icon;
  const storagePct = Math.round((screen.storageUsedGb / screen.storageTotalGb) * 100);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div className="glass-card rounded-lg p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Estado</p>
        <div className={`flex items-center gap-1.5 font-semibold ${st.className}`}>
          <StatusIcon className="h-4 w-4" />
          {st.label}
        </div>
      </div>

      <div className="glass-card rounded-lg p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Última sincronización</p>
        <p className="text-sm font-semibold text-foreground">
          {formatDistanceToNow(new Date(screen.lastSyncAt), { addSuffix: true, locale: es })}
        </p>
      </div>

      <div className="glass-card rounded-lg p-3 space-y-1.5">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <HardDrive className="h-3 w-3" /> Almacenamiento
        </p>
        <Progress value={storagePct} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          {screen.storageUsedGb} / {screen.storageTotalGb} GB
        </p>
      </div>

      <div className="glass-card rounded-lg p-3 space-y-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Volume2 className="h-3 w-3" /> Volumen
        </p>
        <p className="text-sm font-semibold text-foreground">{screen.volume}%</p>
      </div>

      <div className="glass-card rounded-lg p-3 space-y-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" /> Zona horaria
        </p>
        <p className="text-sm font-semibold text-foreground truncate">{screen.timezone}</p>
      </div>
    </div>
  );
}
