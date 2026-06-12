import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, ArrowRight, Info } from "lucide-react";
import { fmtCOP, calculateProration, calculateMonthlyTotal, marginalPrice, daysRemaining, nextBillingDate } from "@/lib/proration";
import type { SubscriptionRow } from "@/hooks/useSubscriptionData";

interface Props {
  subscription: SubscriptionRow | null;
  currentScreens: number;
  onConfirmChange: (newCount: number, immediateCharge: number, nextCycleTotal: number) => void;
}

export function ProrationSimulator({ subscription, currentScreens, onConfirmChange }: Props) {
  const [targetScreens, setTargetScreens] = useState(currentScreens);
  const anchor = subscription ? new Date(subscription.billing_anchor) : new Date();
  const today = new Date();
  const remaining = daysRemaining(anchor, today);
  const nextDate = nextBillingDate(anchor, today);

  const delta = targetScreens - currentScreens;

  const simulation = useMemo(() => {
    if (delta === 0) return null;

    const nextCycleTotal = calculateMonthlyTotal(targetScreens);
    const currentCycleTotal = calculateMonthlyTotal(currentScreens);

    if (delta > 0) {
      // Adding screens: each new screen pays its tier price (graduated brackets)
      const screensToAdd = delta;
      const breakdown = Array.from({ length: screensToAdd }).map((_, i) => {
        const screenIndex = currentScreens + i + 1;
        const price = marginalPrice(screenIndex);
        const proration = calculateProration(price, anchor, today);
        return {
          screenIndex,
          unitPrice: price,
          dailyRate: proration.dailyRate,
          daysLeft: proration.daysLeft,
          amount: proration.amount,
        };
      });
      const immediateCharge = Math.round(breakdown.reduce((s, b) => s + b.amount, 0) * 100) / 100;

      return {
        type: "add" as const,
        screensToAdd,
        breakdown,
        immediateCharge,
        nextCycleTotal,
      };
    } else {
      // Removing screens: refund the marginal price of each removed (top-tier first)
      const screensToRemove = Math.abs(delta);
      let creditAmount = 0;
      let daysLeft = 0;
      for (let i = 0; i < screensToRemove; i++) {
        const screenIndex = currentScreens - i; // remove from the top
        const price = marginalPrice(screenIndex);
        const credit = calculateProration(price, anchor, today);
        creditAmount += credit.amount;
        daysLeft = credit.daysLeft;
      }
      creditAmount = Math.round(creditAmount * 100) / 100;

      return {
        type: "remove" as const,
        screensToRemove,
        creditAmount,
        nextCycleTotal,
        daysLeft,
        savings: currentCycleTotal - nextCycleTotal,
      };
    }
  }, [targetScreens, currentScreens, anchor, delta]);

  return (
    <Card className="surface-elevated border-border/30">
      <CardHeader className="pb-3 px-6">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Simulador de cambios
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        {/* Stepper */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pantallas deseadas</span>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setTargetScreens(Math.max(1, targetScreens - 1))}
                disabled={targetScreens <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="font-display text-3xl font-bold w-16 text-center text-gradient-primary">{targetScreens}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setTargetScreens(Math.min(300, targetScreens + 1))}
                disabled={targetScreens >= 300}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Slider
            value={[targetScreens]}
            onValueChange={([v]) => setTargetScreens(v)}
            min={1}
            max={300}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span><span>50</span><span>100</span><span>200</span><span>300</span>
          </div>
        </div>

        {/* Results */}
        {simulation && simulation.type === "add" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Cobro inmediato prorrateado
              </p>
              <div className="grid gap-2 text-sm">
                {Array.from({ length: simulation.screensToAdd }).map((_, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>Pantalla nueva #{i + 1} · {simulation.daysLeft} días × {fmtCOP(Math.round(simulation.dailyRate))}/día</span>
                    <span className="text-foreground font-medium">{fmtCOP(simulation.perScreenProration)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border/30 font-bold text-base">
                  <span>Te cobraremos hoy</span>
                  <span className="text-gradient-primary">{fmtCOP(simulation.immediateCharge)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/30 bg-secondary/20 p-5 space-y-2">
              <p className="text-sm font-semibold">Próximo ciclo completo</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{targetScreens} pantallas × {fmtCOP(simulation.unitPrice)}</span>
                <span className="font-bold">{fmtCOP(simulation.nextCycleTotal)} /mes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                A partir del {nextDate.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <Button
              onClick={() => onConfirmChange(targetScreens, simulation.immediateCharge, simulation.nextCycleTotal)}
              className="w-full gradient-primary glow-primary-sm text-primary-foreground border-0 gap-2 h-12"
            >
              Confirmar y pagar {fmtCOP(simulation.immediateCharge)}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {simulation && simulation.type === "remove" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                <Info className="h-4 w-4" />
                Crédito a favor
              </p>
              <p className="text-sm text-muted-foreground">
                Al eliminar {simulation.screensToRemove} pantalla{simulation.screensToRemove > 1 ? "s" : ""} con {simulation.daysLeft} días
                restantes, obtienes un crédito de <span className="text-foreground font-medium">{fmtCOP(simulation.creditAmount)}</span> que
                se aplicará en tu próxima factura.
              </p>
            </div>

            <div className="rounded-xl border border-border/30 bg-secondary/20 p-5 space-y-2">
              <p className="text-sm font-semibold">Próximo ciclo</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{targetScreens} pantallas × {fmtCOP(getUnitPrice(targetScreens))}</span>
                <span className="font-bold">{fmtCOP(simulation.nextCycleTotal)} /mes</span>
              </div>
            </div>

            <Button
              onClick={() => onConfirmChange(targetScreens, 0, simulation.nextCycleTotal)}
              variant="outline"
              className="w-full gap-2 h-12"
            >
              Confirmar reducción
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!simulation && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Mueve el control para simular un cambio de pantallas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
