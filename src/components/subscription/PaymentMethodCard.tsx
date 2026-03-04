import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Pencil } from "lucide-react";
import type { PaymentMethodRow } from "@/hooks/useSubscriptionData";

interface Props {
  methods: PaymentMethodRow[];
  onAddMethod: () => void;
  onEditMethod: (id: string) => void;
}

function brandIcon(brand: string) {
  const b = brand.toLowerCase();
  if (b === "visa") return "💳 Visa";
  if (b === "mastercard") return "💳 Mastercard";
  if (b === "amex") return "💳 Amex";
  return `💳 ${brand}`;
}

export function PaymentMethodCard({ methods, onAddMethod, onEditMethod }: Props) {
  const defaultMethod = methods.find((m) => m.is_default) ?? methods[0];

  return (
    <Card className="surface-elevated border-border/30">
      <CardHeader className="pb-3 px-6 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Método de pago
        </CardTitle>
        {methods.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => defaultMethod && onEditMethod(defaultMethod.id)} className="gap-1.5 text-xs">
            <Pencil className="h-3 w-3" />
            Cambiar
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {defaultMethod ? (
          <div className="flex items-center gap-4 rounded-xl border border-border/30 bg-secondary/20 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
              💳
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{brandIcon(defaultMethod.brand)} •••• {defaultMethod.last4}</p>
              <p className="text-xs text-muted-foreground">
                Vence {String(defaultMethod.exp_month).padStart(2, "0")}/{defaultMethod.exp_year}
              </p>
            </div>
            {defaultMethod.is_default && (
              <span className="text-xs text-primary font-medium">Predeterminada</span>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground mb-4">No tienes un método de pago registrado</p>
            <Button size="sm" variant="outline" onClick={onAddMethod} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Agregar tarjeta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
