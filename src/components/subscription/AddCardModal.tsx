import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onSuccess: () => void;
}

export function AddCardModal({ open, onOpenChange, businessId, onSuccess }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [number, setNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const resetForm = () => {
    setNumber("");
    setExpMonth("");
    setExpYear("");
    setCvc("");
    setCardHolder("");
    setEmail("");
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        title: "Aceptación requerida",
        description: "Debes aceptar los términos y la política de datos para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("wompi-tokenize-card", {
        body: {
          business_id: businessId,
          number: number.replace(/\s/g, ""),
          exp_month: expMonth,
          exp_year: expYear,
          cvc,
          card_holder: cardHolder,
          customer_email: email,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Error al guardar la tarjeta");

      toast({
        title: "Tarjeta guardada",
        description: `Tu ${data.brand ?? "tarjeta"} terminada en ${data.last4} quedó registrada para futuros pagos.`,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast({
        title: "Error al guardar tarjeta",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 16);
    return v.replace(/(\d{4})/g, "$1 ").trim();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Agregar tarjeta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-number">Número de tarjeta</Label>
            <Input
              id="card-number"
              placeholder="0000 0000 0000 0000"
              value={formatCardNumber(number)}
              onChange={(e) => setNumber(e.target.value.replace(/\s/g, ""))}
              disabled={loading}
              maxLength={19}
              inputMode="numeric"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="exp-month">Mes</Label>
              <Input
                id="exp-month"
                placeholder="MM"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                disabled={loading}
                maxLength={2}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-year">Año</Label>
              <Input
                id="exp-year"
                placeholder="AA"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                disabled={loading}
                maxLength={2}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={loading}
                maxLength={4}
                inputMode="numeric"
                type="password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-holder">Titular de la tarjeta</Label>
            <Input
              id="card-holder"
              placeholder="Como aparece en la tarjeta"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border/30 p-3 bg-secondary/10">
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
                disabled={loading}
              />
              <Label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer font-normal">
                Acepto los{" "}
                <a
                  href="https://wompi.co/wp-content/uploads/2019/09/TERMINOS-Y-CONDICIONES-DE-USO-USUARIOS-WOMPI.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Términos y Condiciones de Wompi
                </a>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="privacy"
                checked={acceptedPrivacy}
                onCheckedChange={(v) => setAcceptedPrivacy(v === true)}
                disabled={loading}
              />
              <Label htmlFor="privacy" className="text-xs leading-relaxed cursor-pointer font-normal">
                Autorizo el{" "}
                <a
                  href="https://wompi.com/assets/downloadble/autorizacion-administracion-datos-personales.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  tratamiento de mis datos personales
                </a>{" "}
                según la política de Wompi
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Guardar tarjeta
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
