import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Building2, Smartphone, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
  defaultAmount?: number;
}

type Method = "CARD" | "PSE" | "NEQUI";

export function OneTimePaymentCard({ businessId, defaultAmount = 50000 }: Props) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [loading, setLoading] = useState<Method | null>(null);

  const pay = async (method: Method) => {
    if (!businessId) {
      toast({ title: "No hay negocio asociado", variant: "destructive" });
      return;
    }
    if (!amount || amount < 1500) {
      toast({ title: "Monto mínimo 1.500 COP", variant: "destructive" });
      return;
    }
    setLoading(method);
    try {
      const { data, error } = await supabase.functions.invoke("wompi-create-payment", {
        body: {
          business_id: businessId,
          amount_cop: amount,
          description: `Pago ${method} - ${amount.toLocaleString("es-CO")} COP`,
          payment_type: "one_time",
          payment_method: method,
        },
      });
      if (error) throw error;
      if (!data?.checkout_url) throw new Error("No se recibió URL de pago");
      window.location.href = data.checkout_url;
    } catch (err: any) {
      toast({ title: "Error al iniciar pago", description: err.message, variant: "destructive" });
      setLoading(null);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base">Pago único</CardTitle>
        <p className="text-xs text-muted-foreground">
          Realiza un pago no recurrente con el método que prefieras.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ot-amount" className="text-xs">Monto (COP)</Label>
          <Input
            id="ot-amount"
            type="number"
            min={1500}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="justify-start"
            disabled={loading !== null}
            onClick={() => pay("CARD")}
          >
            {loading === "CARD" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Pagar con Tarjeta
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            disabled={loading !== null}
            onClick={() => pay("PSE")}
          >
            {loading === "PSE" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}
            Pagar con PSE
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            disabled={loading !== null}
            onClick={() => pay("NEQUI")}
          >
            {loading === "NEQUI" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
            Pagar con Nequi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
