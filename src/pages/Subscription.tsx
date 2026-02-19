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
  Receipt,
  Sparkles,
  Palette,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ─── Software Plan Definitions ─── */
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    pricePerScreen: 50000,
    maxScreens: 5,
    storage: "10 GB",
    support: "Email",
    tag: null,
    features: [
      "Hasta 5 pantallas",
      "Programación básica",
      "1 capa de contenido",
      "Analíticas básicas",
      "Soporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    pricePerScreen: 42000,
    maxScreens: 20,
    storage: "50 GB",
    support: "Prioritario",
    tag: "Más popular",
    features: [
      "Hasta 20 pantallas",
      "Programación avanzada",
      "Capas ilimitadas",
      "Analíticas avanzadas",
      "Soporte prioritario",
      "Plantillas premium",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    pricePerScreen: 35000,
    maxScreens: 50,
    storage: "150 GB",
    support: "Dedicado 24/7",
    tag: null,
    features: [
      "Hasta 50 pantallas",
      "Todo en Pro",
      "API access",
      "SLA garantizado",
      "Soporte dedicado 24/7",
      "Capacitación incluida",
    ],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];
type ProductTab = "software" | "studio";

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

/* ─── Studio plans data ─── */
const STUDIO_PLANS = [
  {
    id: "start",
    name: "Start",
    icon: Zap,
    setup: "$1.500.000",
    monthly: "$350.000 / mes",
    description: "Para negocios que inician su presencia visual",
    timeline: "Entrega en 5 días hábiles",
    highlighted: false,
    badge: null,
    features: [
      "10 piezas visuales diseñadas",
      "Adaptación a formato de pantalla",
      "1 actualización mensual",
      "Fotografía de producto (básica)",
      "Soporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    setup: "$3.500.000",
    monthly: "$890.000 / mes",
    description: "Contenido estratégico para maximizar ventas",
    timeline: "Entrega en 3 días hábiles",
    highlighted: true,
    badge: "Más popular",
    features: [
      "30 piezas visuales diseñadas",
      "Video y animación incluidos",
      "Actualizaciones ilimitadas",
      "Estrategia de contenido mensual",
      "Fotografía profesional completa",
      "Soporte prioritario",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    icon: Building2,
    setup: "Desde $6.500.000",
    monthly: "Precio según proyecto",
    description: "Producción audiovisual de máximo impacto",
    timeline: "Cronograma a medida",
    highlighted: false,
    badge: null,
    features: [
      "Todo en Pro",
      "Producción audiovisual completa",
      "Fotografía profesional premium",
      "Gestor de cuenta dedicado",
      "Estrategia anual de contenido",
      "SLA garantizado",
    ],
  },
];

const Subscription = () => {
  const { toast } = useToast();

  /* Data */
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [activeScreens, setActiveScreens] = useState(0);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* UI state */
  const [activeTab, setActiveTab] = useState<ProductTab>("software");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("starter");
  const [screenCount, setScreenCount] = useState(1);
  const [yearly, setYearly] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Checkout form */
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
  const yearlyTotal = monthlyTotal * 12 * 0.8;

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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Suscripción</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu plan y servicios de Visualia</p>
      </div>

      {/* ─── TOP PRODUCT TOGGLE ─── */}
      <div className="space-y-4">
        {/* Pill toggle */}
        <div className="inline-flex rounded-full border border-border/40 bg-secondary/30 p-1 gap-1">
          <button
            onClick={() => setActiveTab("software")}
            className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 ${
              activeTab === "software"
                ? "gradient-primary text-primary-foreground shadow-[0_0_16px_hsl(270_100%_50%/0.35)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
            Software Visualia
          </button>
          <button
            onClick={() => setActiveTab("studio")}
            className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 ${
              activeTab === "studio"
                ? "gradient-primary text-primary-foreground shadow-[0_0_16px_hsl(270_100%_50%/0.35)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
            Visualia Studio
          </button>
        </div>

        {/* Info text below toggle */}
        <p className="text-xs text-muted-foreground max-w-lg">
          Visualia incluye dos soluciones:{" "}
          <span className="text-foreground font-medium">Software Visualia</span> controla tus pantallas —{" "}
          <span className="text-foreground font-medium">Visualia Studio</span> diseña el contenido que se muestra en ellas.
        </p>
      </div>

      {/* ─── SOFTWARE VISUALIA SECTION ─── */}
      <div
        className={`space-y-6 transition-all duration-250 ${
          activeTab === "software" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute"
        }`}
        style={{ display: activeTab === "software" ? "block" : "none" }}
      >
        {/* Section header */}
        <div>
          <h2 className="font-display text-xl font-bold">Controla tus pantallas con Visualia</h2>
          <p className="text-sm text-muted-foreground mt-1">Paga solo por las pantallas que usas. Sin contratos.</p>
        </div>

        {/* Current plan status */}
        {subscription && (
          <Card className="surface-elevated border-border/30 overflow-hidden">
            <div className="gradient-primary h-1" />
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Plan actual
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* Screen configurator */}
        <Card className="surface-elevated border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              ¿Cuántas pantallas deseas?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-gradient-primary">{screenCount}</span>
                <span className="text-muted-foreground text-sm">pantallas</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="yearly" className="text-sm text-muted-foreground">Mensual</Label>
                <Switch id="yearly" checked={yearly} onCheckedChange={setYearly} />
                <Label htmlFor="yearly" className="text-sm">
                  Anual <span className="text-primary font-semibold">(-20%)</span>
                </Label>
              </div>
            </div>

            <Slider
              value={[screenCount]}
              onValueChange={([v]) => setScreenCount(v)}
              min={1}
              max={100}
              step={1}
              className="py-2"
            />

            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="rounded-xl bg-secondary/40 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Precio por pantalla</p>
                <p className="text-lg font-bold">{fmt(selectedPlanDef.pricePerScreen)}</p>
              </div>
              <div className="rounded-xl bg-secondary/40 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {yearly ? "Ahorro anual" : "Total mensual"}
                </p>
                <p className="text-lg font-bold">
                  {yearly ? fmt(monthlyTotal * 12 * 0.2) : fmt(monthlyTotal)}
                </p>
              </div>
              <div className="rounded-xl gradient-primary glow-primary-sm p-4 text-center">
                <p className="text-xs text-primary-foreground/70 mb-1">
                  {yearly ? "Total mensual con descuento" : "Total mensual"}
                </p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {fmt(yearly ? yearlyTotal / 12 : monthlyTotal)}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setCheckoutOpen(true)}
              className="w-full gradient-primary glow-primary-sm text-primary-foreground border-0 h-12 text-base font-semibold"
            >
              Activar suscripción
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card className="surface-elevated border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
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
      </div>

      {/* ─── VISUALIA STUDIO SECTION ─── */}
      <div style={{ display: activeTab === "studio" ? "block" : "none" }} className="space-y-6">
        {/* Section header */}
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-display text-xl font-bold">
                Contenido profesional que hace que tus pantallas vendan más
              </h2>
              <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary tracking-widest uppercase">
                Servicio opcional
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Servicio opcional de diseño, fotografía y contenido estratégico. No necesitas saber de diseño.
              Nuestro equipo crea el contenido y tú solo lo publicas.
            </p>
          </div>
        </div>

        {/* Studio plan cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {STUDIO_PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-6 flex flex-col transition-all ${
                  plan.highlighted
                    ? "border border-primary bg-primary/5 shadow-[0_0_24px_hsl(270_100%_50%/0.15)]"
                    : "border border-border/30 bg-card/40"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${plan.highlighted ? "gradient-primary" : "bg-secondary/60"}`}>
                    <Icon className={`h-5 w-5 ${plan.highlighted ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-1">
                  <span className={`text-2xl font-bold ${plan.highlighted ? "text-primary" : ""}`}>
                    {plan.setup}
                  </span>
                  {plan.id !== "elite" && (
                    <span className="text-xs text-muted-foreground"> setup único</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{plan.monthly}</p>
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60" />
                  {plan.timeline}
                </p>

                {/* Features */}
                <ul className="space-y-2 border-t border-border/20 pt-4 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${plan.highlighted ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="/studio"
                  className={`block w-full rounded-lg py-2.5 text-sm font-semibold text-center transition-all ${
                    plan.highlighted
                      ? "gradient-primary text-primary-foreground hover:opacity-90"
                      : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
                  }`}
                >
                  Solicitar propuesta →
                </a>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Visualia Studio es un servicio independiente del software. Puedes contratarlos por separado o juntos.
        </p>
      </div>

      {/* ─── Checkout Dialog ─── */}
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
              className="gradient-primary hover:opacity-90 glow-primary-sm text-primary-foreground border-0 gap-2"
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
