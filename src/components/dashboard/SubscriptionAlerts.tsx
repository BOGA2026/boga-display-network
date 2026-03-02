import { useEffect, useState } from "react";
import { AlertTriangle, Clock, XCircle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SubscriptionAlertsProps {
  expiresAt: string | null;
  gracePeriodEndsAt: string | null;
  status: string;
}

export function SubscriptionAlerts({ expiresAt, gracePeriodEndsAt, status }: SubscriptionAlertsProps) {
  const [alerts, setAlerts] = useState<{ type: "warn" | "danger" | "expired" | "suspended"; message: string }[]>([]);

  useEffect(() => {
    const newAlerts: typeof alerts = [];
    const now = Date.now();

    if (status === "suspended" || status === "inactive") {
      newAlerts.push({
        type: "suspended",
        message: "Tu suscripción está suspendida. Las pantallas han dejado de sincronizar contenido.",
      });
    } else if (expiresAt) {
      const expDate = new Date(expiresAt).getTime();
      const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        // Expired
        if (gracePeriodEndsAt) {
          const graceEnd = new Date(gracePeriodEndsAt).getTime();
          const graceHoursLeft = Math.max(0, Math.ceil((graceEnd - now) / (1000 * 60 * 60)));
          if (graceHoursLeft > 0) {
            newAlerts.push({
              type: "expired",
              message: `Tu pago ha vencido. Tienes ${graceHoursLeft} horas para renovar antes de que tus pantallas se desactiven.`,
            });
          } else {
            newAlerts.push({
              type: "suspended",
              message: "El periodo de gracia ha terminado. Tus pantallas han sido desactivadas.",
            });
          }
        } else {
          newAlerts.push({
            type: "expired",
            message: "Tu suscripción ha vencido. Renueva para mantener tus pantallas activas.",
          });
        }
      } else if (daysLeft <= 2) {
        newAlerts.push({
          type: "danger",
          message: `Tu suscripción vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}. Renueva ahora para evitar interrupciones.`,
        });
      } else if (daysLeft <= 5) {
        newAlerts.push({
          type: "warn",
          message: `Tu suscripción vence en ${daysLeft} días. Te recomendamos renovar pronto.`,
        });
      }
    }

    setAlerts(newAlerts);
  }, [expiresAt, gracePeriodEndsAt, status]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const config = {
          warn: { icon: Clock, bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
          danger: { icon: AlertTriangle, bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
          expired: { icon: XCircle, bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive" },
          suspended: { icon: XCircle, bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive" },
        }[alert.type];

        const Icon = config.icon;

        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
              config.bg, config.border
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", config.text)} />
            <span className="flex-1">{alert.message}</span>
            <Button
              size="sm"
              variant="outline"
              className={cn("shrink-0 text-xs gap-1.5", config.border, config.text, "hover:bg-secondary/50")}
              asChild
            >
              <Link to="/dashboard/suscripcion">
                <CreditCard className="h-3 w-3" />
                Ir a Suscripción
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
