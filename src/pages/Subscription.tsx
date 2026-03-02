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

/* ─── Studio plans data (mirrored from /studio page) ─── */
const STUDIO_PLANS = [
  {
    id: "impulso",
    name: "Impulso Visual",
    ideal: "Restaurantes y cafés que quieren empezar con un menú digital profesional.",
    setup: "$990.000",
    monthly: "$99.000",
    monthlyLabel: "COP / mes por pantalla",
    highlighted: false,
    badge: null,
    includesFrom: null,
    features: [
      "Diseño profesional de carta digital",
      "Adaptación visual a tus pantallas",
      "Configuración inicial del sistema",
      "Programación básica de contenidos",
      "Plataforma Visualia activa 24/7",
      "Soporte técnico remoto",
    ],
    monthlyDetail: {
      title: "1 ajuste mensual de tu menú",
      options: [
        "Actualización de precios",
        "Cambio o actualización de productos",
      ],
      note: "Las fotografías y contenidos del menú deben ser suministrados por el cliente.",
    },
  },
  {
    id: "crecimiento",
    name: "Crecimiento Comercial",
    ideal: "Negocios que quieren vender más activamente.",
    setup: "$2.900.000",
    monthly: "$299.000",
    monthlyLabel: "COP / mes",
    highlighted: true,
    badge: "MÁS ELEGIDO POR RESTAURANTES",
    includesFrom: "Todo lo de Impulso Visual más:",
    features: [
      "Rediseño estratégico del menú digital",
      "Optimización visual de productos",
      "Imágenes generadas con IA a partir de fotografías reales",
      "Programación automática por horarios",
      "Promociones destacadas en pantalla",
      "1 actualización mensual de precios o productos",
      "Optimización continua del contenido",
    ],
    monthlyDetail: {
      title: null,
      options: [],
      note: "Las imágenes se optimizan a partir de fotografías reales proporcionadas por el cliente.",
    },
  },
  {
    id: "dominio",
    name: "Dominio de Marca",
    ideal: "Cadenas o marcas en expansión.",
    setup: "Desde $5.900.000",
    monthly: "Desde $1.490.000",
    monthlyLabel: "COP / mes",
    highlighted: false,
    badge: null,
    includesFrom: "Todo lo de Crecimiento Comercial más:",
    features: [
      "Gestión multi-sede",
      "Producción audiovisual",
      "Campañas comerciales",
      "Videos promocionales",
      "Actualizaciones ilimitadas",
      "Estrategia visual continua",
      "Prioridad en soporte",
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
    <div className="p-8 lg:p-12 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold">Suscripción</h1>
        <p className="text-base text-muted-foreground mt-2">Gestiona tu plan y servicios de Visualia</p>
      </div>

      {/* ─── TOP PRODUCT TOGGLE ─── */}
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Pill toggle */}
        <div className="inline-flex rounded-full border border-border/40 bg-secondary/30 p-2 gap-2">
          <button
            onClick={() => setActiveTab("software")}
            className={`relative px-10 py-4 rounded-full text-xl font-bold transition-all duration-250 ${
              activeTab === "software"
                ? "gradient-primary text-white shadow-[0_0_24px_hsl(270_100%_50%/0.45)]"
                : "text-foreground/80 hover:text-white"
            }`}
          >
            <Monitor className="inline h-5 w-5 mr-2.5 -mt-0.5" />
            Software Visualia
          </button>
          <button
            onClick={() => setActiveTab("studio")}
            className={`relative px-10 py-4 rounded-full text-xl font-bold transition-all duration-250 ${
              activeTab === "studio"
                ? "gradient-primary text-white shadow-[0_0_24px_hsl(270_100%_50%/0.45)]"
                : "text-foreground/80 hover:text-white"
            }`}
          >
            <Palette className="inline h-5 w-5 mr-2.5 -mt-0.5" />
            Visualia Studio
          </button>
        </div>

        {/* Info text below toggle */}
        <p className="text-base text-foreground/70 max-w-2xl">
          Visualia incluye dos soluciones:{" "}
          <span className="text-white font-semibold">Software Visualia</span> controla tus pantallas —{" "}
          <span className="text-white font-semibold">Visualia Studio</span> diseña el contenido que se muestra en ellas.
        </p>
      </div>

      {/* ─── SOFTWARE VISUALIA SECTION ─── */}
      <div
        className={`space-y-8 transition-all duration-250 ${
          activeTab === "software" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute"
        }`}
        style={{ display: activeTab === "software" ? "block" : "none" }}
      >
        {/* Section header */}
        <div>
          <h2 className="font-display text-3xl font-bold">Controla tus pantallas con Visualia</h2>
          <p className="text-base text-muted-foreground mt-2">Paga solo por las pantallas que usas. Sin contratos.</p>
        </div>

        {/* Current plan status */}
        {subscription && (
          <Card className="surface-elevated border-border/30 overflow-hidden">
            <div className="gradient-primary h-1.5" />
            <CardHeader className="pb-3 pt-6 px-8">
              <CardTitle className="font-display text-xl flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                Plan actual
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plan</p>
                  <p className="font-semibold text-2xl text-gradient-primary">{currentPlanDef.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pantallas</p>
                  <p className="font-semibold text-lg">
                    {activeScreens} activas / {subscription.screens_count} disponibles
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Precio</p>
                  <p className="font-semibold text-lg">{fmt(subscription.price_per_screen)} /pantalla</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Próxima facturación</p>
                  <p className="font-semibold text-lg">
                    {new Date(subscription.next_billing_date).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1">
                    {subscription.billing_cycle === "yearly" ? "Anual" : "Mensual"}
                  </Badge>
                  <Badge className={`text-sm px-3 py-1 ${subscription.status === "active" ? "bg-primary/20 text-primary border-primary/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}>
                    {subscription.status === "active" ? "Activa" : subscription.status}
                  </Badge>
                  <span className="text-base text-muted-foreground">
                    Almacenamiento: {currentPlanDef.storage}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Screen configurator */}
        <Card className="surface-elevated border-border/30">
          <CardHeader className="pb-3 pt-8 px-8">
            <CardTitle className="font-display text-xl flex items-center gap-3">
              <Monitor className="h-6 w-6 text-primary" />
              ¿Cuántas pantallas deseas?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-8">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-end gap-3">
                <span className="text-8xl font-bold text-gradient-primary leading-none">{screenCount}</span>
                <span className="text-muted-foreground text-xl mb-3">pantallas</span>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="yearly" className="text-base text-muted-foreground">Mensual</Label>
                <Switch id="yearly" checked={yearly} onCheckedChange={setYearly} className="scale-125" />
                <Label htmlFor="yearly" className="text-base">
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
              className="py-4"
            />

            <div className="grid gap-5 sm:grid-cols-3 pt-2">
              <div className="rounded-2xl bg-secondary/40 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Precio por pantalla</p>
                <p className="text-2xl font-bold">{fmt(selectedPlanDef.pricePerScreen)}</p>
              </div>
              <div className="rounded-2xl bg-secondary/40 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {yearly ? "Ahorro anual" : "Total mensual"}
                </p>
                <p className="text-2xl font-bold">
                  {yearly ? fmt(monthlyTotal * 12 * 0.2) : fmt(monthlyTotal)}
                </p>
              </div>
              <div className="rounded-2xl gradient-primary glow-primary-sm p-6 text-center">
                <p className="text-sm text-primary-foreground/70 mb-2">
                  {yearly ? "Total mensual con descuento" : "Total mensual"}
                </p>
                <p className="text-3xl font-bold text-primary-foreground">
                  {fmt(yearly ? yearlyTotal / 12 : monthlyTotal)}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setCheckoutOpen(true)}
              className="w-full gradient-primary glow-primary-sm text-primary-foreground border-0 h-16 text-lg font-bold"
            >
              Activar suscripción
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card className="surface-elevated border-border/30">
            <CardHeader className="pb-3 pt-8 px-8">
              <CardTitle className="font-display text-xl flex items-center gap-3">
                <Receipt className="h-6 w-6 text-primary" />
                Historial de pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-base">Fecha</TableHead>
                    <TableHead className="text-base">Factura</TableHead>
                    <TableHead className="text-base">Monto</TableHead>
                    <TableHead className="text-base">Estado</TableHead>
                    <TableHead className="text-right text-base">Descargar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className="border-border/30">
                      <TableCell className="text-base py-4">
                        {new Date(p.created_at).toLocaleDateString("es-CO")}
                      </TableCell>
                      <TableCell className="font-mono text-sm py-4">{p.invoice_number}</TableCell>
                      <TableCell className="font-semibold text-base py-4">{fmt(p.amount)}</TableCell>
                      <TableCell className="py-4">
                        <Badge className={`text-sm px-3 py-1 ${p.status === "completed" ? "bg-primary/20 text-primary border-primary/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}>
                          {p.status === "completed" ? "Pagado" : p.status === "pending" ? "Pendiente" : p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                          <Download className="h-5 w-5" />
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
      <div style={{ display: activeTab === "studio" ? "block" : "none" }} className="space-y-8">
        {/* Section header */}
        <div>
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <h2 className="font-display text-3xl font-bold">
              Ahora hagamos que tus pantallas realmente vendan
            </h2>
            <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary tracking-widest uppercase">
              Servicio opcional
            </span>
          </div>
          <p className="text-base text-muted-foreground max-w-2xl">
            Visualia Studio es nuestro servicio especializado de creación de contenido para pantallas digitales.
            Nos enfocamos en diseñar el contenido que verán tus clientes para mejorar su decisión de compra.
          </p>
        </div>

        {/* Explanation card */}
        <div
          className="rounded-xl border p-6 text-center"
          style={{
            borderColor: "hsl(270 100% 50% / 0.15)",
            background: "linear-gradient(180deg, hsl(260 30% 12%) 0%, hsl(260 25% 9%) 100%)",
          }}
        >
          <p className="text-base text-muted-foreground">
            Este es un <span className="font-semibold text-foreground">servicio adicional</span> a la plataforma Visualia.
            Aquí no pagas por pantallas. Nos enfocamos en diseñar el contenido que verán tus clientes.
          </p>
          <div
            className="mx-auto mt-5 max-w-md rounded-lg border px-5 py-4"
            style={{
              borderColor: "hsl(270 100% 50% / 0.3)",
              background: "hsl(270 100% 50% / 0.06)",
            }}
          >
            <p className="text-base font-bold text-foreground">
              No importa si tienes 1 o 100 pantallas.{" "}
              <span className="text-gradient-primary">Lo importante es qué muestran.</span>
            </p>
          </div>
        </div>

        {/* Studio plan cards */}
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          {STUDIO_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-2xl border p-8 flex flex-col transition-all ${
                plan.highlighted
                  ? "border-primary bg-primary/5 shadow-[0_0_32px_hsl(270_100%_50%/0.18)] lg:-mt-4 lg:pb-12 lg:pt-12"
                  : "border-border/30 bg-card/40"
              }`}
            >
              {plan.highlighted && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-10"
                  style={{ background: "radial-gradient(ellipse at top center, hsl(270 100% 50%) 0%, transparent 60%)" }}
                />
              )}

              <div className="relative flex-1 flex flex-col">
                {plan.badge && (
                  <div className="mb-5">
                    <Badge className="gradient-primary border-0 px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
                      <Sparkles className="mr-1.5 h-3 w-3" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <h3 className={`font-display text-2xl font-bold ${plan.highlighted ? "text-gradient-primary" : ""}`}>
                  {plan.name}
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/70">Ideal para:</span>{" "}
                  {plan.ideal}
                </p>

                {/* Pricing */}
                <div className="mt-6 space-y-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Inversión inicial</span>
                    <p className="font-display text-2xl font-bold">
                      {plan.setup} <span className="text-sm font-normal text-muted-foreground">COP</span>
                    </p>
                  </div>
                  <div
                    className="rounded-xl px-5 py-4"
                    style={{
                      background: plan.highlighted ? "hsl(270 100% 50% / 0.08)" : "hsl(260 20% 12%)",
                      border: plan.highlighted ? "1px solid hsl(270 100% 50% / 0.2)" : "1px solid hsl(260 15% 16%)",
                    }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Servicio mensual</span>
                    <p className="font-display text-xl font-bold">
                      {plan.monthly} <span className="text-xs font-normal text-muted-foreground">{plan.monthlyLabel}</span>
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6">
                  {plan.includesFrom && (
                    <p className="mb-3 text-xs font-semibold text-primary">{plan.includesFrom}</p>
                  )}
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.highlighted ? "text-primary" : "text-muted-foreground"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Monthly detail */}
                {"monthlyDetail" in plan && plan.monthlyDetail && (
                  <div className="mt-6">
                    <div
                      className="rounded-xl px-5 py-4"
                      style={{
                        background: "hsl(260 20% 12%)",
                        border: "1px solid hsl(260 15% 20%)",
                      }}
                    >
                      {plan.monthlyDetail.title && (
                        <>
                          <p className="text-sm font-semibold text-foreground mb-2">
                            Tu mensualidad incluye:
                          </p>
                          <p className="text-sm font-medium text-foreground/90 mb-2">
                            {plan.monthlyDetail.title}
                          </p>
                        </>
                      )}
                      {plan.monthlyDetail.options.length > 0 && (
                        <ul className="space-y-1.5 ml-1">
                          {plan.monthlyDetail.options.map((opt: string) => (
                            <li key={opt} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60" />
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className={`text-xs text-muted-foreground/70 italic leading-relaxed ${plan.monthlyDetail.options.length > 0 ? "mt-3" : ""}`}>
                        {plan.monthlyDetail.note}
                      </p>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <a
                  href="/studio"
                  className={`mt-8 block w-full rounded-xl py-4 text-sm font-bold text-center transition-all ${
                    plan.highlighted
                      ? "gradient-primary text-primary-foreground hover:opacity-90"
                      : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
                  }`}
                >
                  Quiero mejorar mis pantallas →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2">
          {[
            { icon: Receipt, text: "Facturación en pesos colombianos" },
            { text: "Sin costos ocultos" },
            { text: "Escalable según tu negocio" },
          ].map((item) => (
            <span key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary" />
              {item.text}
            </span>
          ))}
        </div>
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
