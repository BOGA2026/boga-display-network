import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Monitor, Plus, Pause, Play, Trash2 } from "lucide-react";
import { fmtCOP, fmtDate, calculateProration, calculateMonthlyTotal } from "@/lib/proration";
import type { ScreenItem, SubscriptionRow } from "@/hooks/useSubscriptionData";

interface Props {
  screens: ScreenItem[];
  subscription: SubscriptionRow | null;
  onAddScreen: () => void;
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
  onRemove: (id: string) => void;
}

function licenseStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">Activa</Badge>;
    case "suspended":
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">Suspendida</Badge>;
    case "pending":
      return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">Pendiente</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export function ScreenSubscriptionTable({ screens, subscription, onAddScreen, onSuspend, onReactivate, onRemove }: Props) {
  const anchor = subscription ? new Date(subscription.billing_anchor) : new Date();
  const count = screens.length || 1;
  const unitPrice = Math.round(calculateMonthlyTotal(count) / count); // avg blended price for proration display

  return (
    <Card className="surface-elevated border-border/30">
      <CardHeader className="pb-3 px-6 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          Pantallas y vigencia
        </CardTitle>
        <Button size="sm" onClick={onAddScreen} className="gradient-primary text-primary-foreground border-0 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Agregar pantalla
        </Button>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {screens.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Monitor className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tienes pantallas registradas</p>
            <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={onAddScreen}>
              <Plus className="h-3.5 w-3.5" />
              Agregar primera pantalla
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-xs">Pantalla</TableHead>
                <TableHead className="text-xs">Fecha de alta</TableHead>
                <TableHead className="text-xs">Vigencia hasta</TableHead>
                <TableHead className="text-xs">Estado</TableHead>
                <TableHead className="text-xs text-right">Prorrateo aplicado</TableHead>
                <TableHead className="text-xs text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {screens.map((screen) => {
                const proration = screen.activated_at
                  ? calculateProration(unitPrice, anchor, new Date(screen.activated_at))
                  : null;

                return (
                  <TableRow key={screen.id} className="border-border/20">
                    <TableCell className="py-3">
                      <div>
                        <p className="font-medium text-sm">{screen.name}</p>
                        <p className="text-xs text-muted-foreground">{screen.location_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {screen.activated_at ? fmtDate(screen.activated_at) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {subscription ? fmtDate(subscription.next_billing_date) : "—"}
                    </TableCell>
                    <TableCell>{licenseStatusBadge(screen.license_status)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {proration ? fmtCOP(proration.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {screen.license_status === "active" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-400"
                            onClick={() => onSuspend(screen.id)}
                            title="Suspender"
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-emerald-400"
                            onClick={() => onReactivate(screen.id)}
                            title="Reactivar"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemove(screen.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
