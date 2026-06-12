import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Calendar, CreditCard, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { fmtCOP, fmtDate, daysRemaining, calculateMonthlyTotal, marginalPrice, getStorage } from "@/lib/proration";
import type { SubscriptionRow, ScreenItem } from "@/hooks/useSubscriptionData";

interface Props {
  subscription: SubscriptionRow | null;
  screens: ScreenItem[];
  onManageScreens: () => void;
  onViewInvoices: () => void;
}

function statusConfig(status: string) {
  switch (status) {
    case "active":
      return { label: "Activo", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    case "past_due":
      return { label: "Por vencer", icon: Clock, className: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    default:
      return { label: "Vencido", icon: AlertTriangle, className: "bg-destructive/15 text-destructive border-destructive/30" };
  }
}

export function SubscriptionOverview({ subscription, screens, onManageScreens, onViewInvoices }: Props) {
  const activeScreens = screens.filter((s) => s.license_status === "active").length;
  const sc = subscription ? statusConfig(subscription.status) : null;
  const anchor = subscription ? new Date(subscription.billing_anchor) : new Date();
  const remaining = daysRemaining(anchor);
  const count = activeScreens || 1;
  const monthlyTotal = calculateMonthlyTotal(count);
  const avgPerScreen = Math.round(monthlyTotal / count);
  const nextScreenPrice = marginalPrice(count + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Suscripción</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu plan, pantallas y facturación</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onManageScreens} className="gradient-primary glow-primary-sm text-primary-foreground border-0 gap-2">
            <Monitor className="h-4 w-4" />
            Gestionar pantallas
          </Button>
          <Button variant="outline" onClick={onViewInvoices} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Ver facturas
          </Button>
        </div>
      </div>

      {/* Status bar */}
      {subscription && sc && (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={`${sc.className} gap-1.5 text-sm px-3 py-1`}>
            <sc.icon className="h-3.5 w-3.5" />
            {sc.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Próximo corte: <span className="text-foreground font-medium">{fmtDate(subscription.next_billing_date)}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            ({remaining} días restantes)
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Monitor}
          label="Pantallas activas"
          value={String(activeScreens)}
          subtitle={`de ${subscription?.screens_count ?? 0} disponibles`}
        />
        <KpiCard
          icon={CreditCard}
          label="Valor mensual"
          value={fmtCOP(monthlyTotal)}
          subtitle={`${fmtCOP(unitPrice)} / pantalla`}
        />
        <KpiCard
          icon={Calendar}
          label="Próximo cobro"
          value={subscription ? fmtDate(subscription.next_billing_date) : "—"}
          subtitle={subscription ? fmtCOP(monthlyTotal) : ""}
        />
        <KpiCard
          icon={TrendingUp}
          label="Almacenamiento"
          value={getStorage(activeScreens)}
          subtitle="incluido en tu plan"
        />
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtitle }: { icon: any; label: string; value: string; subtitle: string }) {
  return (
    <Card className="surface-elevated border-border/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-display text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
