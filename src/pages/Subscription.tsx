import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Monitor,
  Download,
  Check,
  Crown,
  Zap,
  Building2,
  ArrowRight,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ─── Plan Definitions ─── */
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    pricePerScreen: 50000,
    maxScreens: 10,
    storage: "5 GB",
    support: "Email",
    features: ["Programación básica", "1 capa de contenido", "Analíticas básicas", "Soporte por email"],
    recommended: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    pricePerScreen: 40000,
    maxScreens: 100,
    storage: "50 GB",
    support: "Prioritario",
    features: ["Programación avanzada", "Capas ilimitadas", "Analíticas avanzadas", "Soporte prioritario", "API access", "Plantillas premium"],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    pricePerScreen: 30000,
    maxScreens: 300,
    storage: "Ilimitado",
    support: "Dedicado 24/7",
    features: ["Todo en Pro", "SLA garantizado", "Soporte dedicado 24/7", "Integraciones custom", "Multi-ubicación avanzada", "Capacitación incluida"],
    recommended: false,
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

interface SubscriptionRow {
  id: string;
  plan: string;
  screens_count: number;
  billing_cycle: string;
  price_per_screen: number;
  total_amount: number;
  status: string;
  next_billing_date: string;
}

interface PaymentRow {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  invoice_number: string;
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

const Subscription = () => {
  const { toast } = useToast();

  // Data
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [activeScreens, setActiveScreens] = useState(0);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("starter");
  const [screenCount, setScreenCount] = useState(1);
  const [yearly, setYearly] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Checkout form
  const [billingName, setBillingName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const profileRes = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();
    const bId = profileRes.data?.business_id;
    setBusinessId(bId ?? null);

    if (!bId) {
      setLoading(false);
      return;
    }

    const [subRes, payRes, screensRes] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("business_id", bId).maybeSingle(),
      supabase.from("payments").select("*").eq("business_id", bId).order("created_at", { ascending: false }),
      supabase.from("screens").select("id"),
    ]);

    if (subRes.data) {
      setSubscription(subRes.data as SubscriptionRow);
      setSelectedPlan(subRes.data.plan as PlanId);
      setScreenCount(subRes.data.screens_count);
      setYearly(subRes.data.billing_cycle === "yearly");
    }
    setPayments((payRes.data ?? []) as PaymentRow[]);
    setActiveScreens(screensRes.data?.length ?? 0);
    setLoading(false);
  };

  const currentPlanDef = useMemo(
    () => PLANS.find((p) => p.id === (subscription?.plan ?? "starter")) ?? PLANS[0],
    [subscription]
  );

  const selectedPlanDef = useMemo(
    () => PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0],
    [selectedPlan]
  );

  const monthlyTotal = selectedPlanDef.pricePerScreen * screenCount;
  const yearlyTotal = monthlyTotal * 12 * 0.8; // 20% discount
  const displayTotal = yearly ? yearlyTotal / 12 : monthlyTotal;

  const handleCheckout = async () => {
    if (!businessId) return;
    if (!billingName.trim() || !billingEmail.trim()) {
      toast({ title: "Completa los campos obligatorios", variant: "destructive" });
      return;
    }

    setSaving(true);

    const cycle = yearly ? "yearly" : "monthly";
    const total = yearly ? yearlyTotal : monthlyTotal;
    const pricePerScreen = selectedPlanDef.pricePerScreen;

    try {
      if (subscription) {
        // Update existing
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan: selectedPlan,
            screens_count: screenCount,
            billing_cycle: cycle,
            price_per_screen: pricePerScreen,
            total_amount: total,
            status: "active",
            next_billing_date: new Date(Date.now() + (yearly ? 365 : 30) * 86400000).toISOString().split("T")[0],
          })
          .eq("id", subscription.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("subscriptions").insert({
          business_id: businessId,
          plan: selectedPlan,
          screens_count: screenCount,
          billing_cycle: cycle,
          price_per_screen: pricePerScreen,
          total_amount: total,
          status: "active",
          next_billing_date: new Date(Date.now() + (yearly ? 365 : 30) * 86400000).toISOString().split("T")[0],
        });

        if (error) throw error;
      }

      // Create payment record
      const invoiceNum = `VIS-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from("payments").insert({
        subscription_id: (await supabase.from("subscriptions").select("id").eq("business_id", businessId).single()).data!.id,
        business_id: businessId,
        amount: total,
        status: "completed",
        payment_method: "card",
        invoice_number: invoiceNum,
        billing_name: billingName.trim(),
        tax_id: taxId.trim() || null,
        billing_email: billingEmail.trim(),
      });

      toast({ title: "¡Suscripción actualizada!", description: `Plan ${selectedPlanDef.name} con ${screenCount} pantallas activado.` });
      setCheckoutOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error al procesar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Suscripción</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu plan, pantallas y facturación</p>
      </div>

      {/* Section 1: Current Plan */}
      <Card className="surface-elevated border-border/30 overflow-hidden">
        <div className="gradient-primary h-1" />
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Plan actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Plan</p>
                <p className="font-semibold text-lg text-gradient-primary">{currentPlanDef.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pantallas</p>
                <p className="font-semibold">
                  {activeScreens} activas / {subscription.screens_count} disponibles
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Precio</p>
                <p className="font-semibold">{fmt(subscription.price_per_screen)} /pantalla</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Próxima facturación</p>
                <p className="font-semibold">
                  {new Date(subscription.next_billing_date).toLocaleDateString("es-CO")}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {subscription.billing_cycle === "yearly" ? "Anual" : "Mensual"}
                </Badge>
                <Badge className={subscription.status === "active" ? "bg-primary/20 text-primary border-primary/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                  {subscription.status === "active" ? "Activa" : subscription.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Almacenamiento: {currentPlanDef.storage}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground">Aún no tienes un plan activo</p>
              <p className="text-xs text-muted-foreground mt-1">Selecciona un plan abajo para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Screen Controller */}
      <Card className="surface-elevated border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            ¿Cuántas pantallas deseas?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-gradient-primary">{screenCount}</span>
              <span className="text-muted-foreground text-sm">pantallas</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="yearly" className="text-sm text-muted-foreground">Mensual</Label>
              <Switch id="yearly" checked={yearly} onCheckedChange={setYearly} />
              <Label htmlFor="yearly" className="text-sm text-muted-foreground">
                Anual <span className="text-primary font-medium">(-20%)</span>
              </Label>
            </div>
          </div>

          <Slider
            value={[screenCount]}
            onValueChange={([v]) => setScreenCount(v)}
            min={1}
            max={selectedPlanDef.maxScreens}
            step={1}
            className="py-2"
          />

          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Precio por pantalla</p>
              <p className="text-lg font-bold">{fmt(selectedPlanDef.pricePerScreen)}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total mensual</p>
              <p className="text-lg font-bold">{fmt(yearly ? yearlyTotal / 12 : monthlyTotal)}</p>
            </div>
            <div className="rounded-lg gradient-primary glow-primary-sm p-4 text-center">
              <p className="text-xs text-primary-foreground/70 mb-1">
                {yearly ? "Total anual" : "Total mensual"}
              </p>
              <p className="text-xl font-bold text-primary-foreground">
                {fmt(yearly ? yearlyTotal : monthlyTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Plan Selector */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">Elige tu plan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-primary glow-primary-sm"
                    : "surface-elevated border-border/30 hover:border-primary/40"
                }`}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setScreenCount(Math.min(screenCount, plan.maxScreens));
                }}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-primary-foreground border-0 px-3">
                      Recomendado
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSelected ? "gradient-primary" : "bg-secondary"}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">Hasta {plan.maxScreens} pantallas</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-2xl font-bold">{fmt(plan.pricePerScreen)}</span>
                    <span className="text-xs text-muted-foreground"> /pantalla/mes</span>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Almacenamiento: {plan.storage}</p>
                    <p>Soporte: {plan.support}</p>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-border/30">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      isSelected
                        ? "gradient-primary hover:gradient-primary-hover text-primary-foreground border-0 glow-primary-sm"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(plan.id);
                      setScreenCount(Math.min(screenCount, plan.maxScreens));
                    }}
                  >
                    {isSelected ? "Seleccionado" : "Seleccionar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Button
          size="lg"
          className="gradient-primary hover:gradient-primary-hover text-primary-foreground border-0 glow-primary gap-2 px-10 py-3 text-base font-semibold"
          onClick={() => setCheckoutOpen(true)}
        >
          Continuar al pago
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Section 5: Payment History */}
      {payments.length > 0 && (
        <Card className="surface-elevated border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Historial de pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Descargar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className="border-border/30">
                    <TableCell className="text-sm">
                      {new Date(p.created_at).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.invoice_number}</TableCell>
                    <TableCell className="font-semibold">{fmt(p.amount)}</TableCell>
                    <TableCell>
                      <Badge className={p.status === "completed" ? "bg-primary/20 text-primary border-primary/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                        {p.status === "completed" ? "Pagado" : p.status === "pending" ? "Pendiente" : p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Completar pago
            </DialogTitle>
            <DialogDescription>
              Plan {selectedPlanDef.name} · {screenCount} pantallas · {yearly ? "Anual" : "Mensual"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Summary */}
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{screenCount} pantallas × {fmt(selectedPlanDef.pricePerScreen)}</span>
                <span>{fmt(monthlyTotal)}/mes</span>
              </div>
              {yearly && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento anual (20%)</span>
                  <span className="text-primary">-{fmt(monthlyTotal * 12 * 0.2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t border-border/30">
                <span>Total {yearly ? "anual" : "mensual"}</span>
                <span className="text-gradient-primary text-lg">{fmt(yearly ? yearlyTotal : monthlyTotal)}</span>
              </div>
            </div>

            {/* Billing Info */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="billing-name">Nombre de facturación *</Label>
                <Input id="billing-name" value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder="Empresa S.A.S." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-id">NIT / Cédula (opcional)</Label>
                <Input id="tax-id" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="900.123.456-7" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-email">Email de facturación *</Label>
                <Input id="billing-email" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} placeholder="facturacion@empresa.com" />
              </div>
            </div>

            {/* Payment method placeholder */}
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center text-sm text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Integración de pasarela de pago</p>
              <p className="text-xs mt-1">Tarjeta de crédito · PSE · Transferencia bancaria</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCheckout}
              disabled={saving || !billingName.trim() || !billingEmail.trim()}
              className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {saving ? "Procesando..." : `Pagar ${fmt(yearly ? yearlyTotal : monthlyTotal)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;
