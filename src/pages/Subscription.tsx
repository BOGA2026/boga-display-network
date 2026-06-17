import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionData } from "@/hooks/useSubscriptionData";
import { SubscriptionOverview } from "@/components/subscription/SubscriptionOverview";
import { ScreenSubscriptionTable } from "@/components/subscription/ScreenSubscriptionTable";
import { ProrationSimulator } from "@/components/subscription/ProrationSimulator";
import { ImmediateChargeModal } from "@/components/subscription/ImmediateChargeModal";
import { InvoicesList } from "@/components/subscription/InvoicesList";
import { PaymentMethodCard } from "@/components/subscription/PaymentMethodCard";
import { AddCardModal } from "@/components/subscription/AddCardModal";


const Subscription = () => {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useSubscriptionData();
  const invoicesRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    newCount: number;
    immediateCharge: number;
    nextCycleTotal: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { businessId, subscription, screens, invoices, paymentMethods, payments } = data;

  const handleManageScreens = () => {
    // Scroll to simulator section
    document.getElementById("proration-simulator")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleViewInvoices = () => {
    invoicesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConfirmChange = (newCount: number, immediateCharge: number, nextCycleTotal: number) => {
    setPendingChange({ newCount, immediateCharge, nextCycleTotal });
    setChargeModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!businessId || !pendingChange) return;
    setSaving(true);

    try {
      // Determine amount to charge NOW (prorated for adds, 0 for reductions)
      const amountToday = Math.max(0, Math.round(pendingChange.immediateCharge));

      if (amountToday === 0) {
        // No charge needed (reduction). Just notify; the cycle change applies on next billing.
        // We do NOT modify subscriptions client-side — that's done by the webhook after a paid event,
        // or by a scheduled job for reductions. For now, surface a notice.
        toast({
          title: "Cambio agendado",
          description: "Tu reducción aplicará en el próximo ciclo. No hay cobro hoy.",
        });
        setChargeModalOpen(false);
        setPendingChange(null);
        return;
      }

      // Call edge function to create payment + get Wompi checkout URL.
      // NO subscription/invoice writes from the client. The webhook activates everything.
      const { data, error } = await supabase.functions.invoke("wompi-create-payment", {
        body: {
          business_id: businessId,
          amount_cop: amountToday,
          description: `Prorrateo por ${pendingChange.newCount - (subscription?.screens_count ?? 0)} pantalla(s) nueva(s)`,
          payment_type: "one_time",
          target_screen_count: pendingChange.newCount,
          proration_breakdown: { next_cycle_total: pendingChange.nextCycleTotal },
        },
      });

      if (error) throw error;
      if (!data?.checkout_url) throw new Error("No se recibió URL de pago");

      // Redirect to Wompi checkout (secure provider environment)
      window.location.href = data.checkout_url;
    } catch (err: any) {
      toast({ title: "Error al iniciar pago", description: err.message, variant: "destructive" });
      setSaving(false);
    }
  };

  const handleSuspendScreen = async (screenId: string) => {
    const { error } = await supabase.from("screens").update({ license_status: "suspended" }).eq("id", screenId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pantalla suspendida" });
      refetch();
    }
  };

  const handleReactivateScreen = async (screenId: string) => {
    const { error } = await supabase.from("screens").update({ license_status: "active" }).eq("id", screenId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pantalla reactivada" });
      refetch();
    }
  };

  const handleRemoveScreen = async (screenId: string) => {
    const { error } = await supabase.from("screens").delete().eq("id", screenId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pantalla eliminada" });
      refetch();
    }
  };

  const handleAddScreen = () => {
    window.location.href = "/dashboard/pantallas";
  };

  const handleAddPaymentMethod = () => {
    toast({
      title: "Tu tarjeta se guarda al pagar",
      description:
        "Wompi guarda automáticamente la tarjeta cuando realizas un pago. Agrega o ajusta pantallas en el simulador para iniciar un cobro y la tarjeta quedará registrada para los próximos ciclos.",
    });
    document.getElementById("proration-simulator")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      {/* A) Header + KPIs */}
      <SubscriptionOverview
        subscription={subscription}
        screens={screens}
        onManageScreens={handleManageScreens}
        onViewInvoices={handleViewInvoices}
      />

      {/* C) Pantallas y vigencia */}
      <ScreenSubscriptionTable
        screens={screens}
        subscription={subscription}
        onAddScreen={handleAddScreen}
        onSuspend={handleSuspendScreen}
        onReactivate={handleReactivateScreen}
        onRemove={handleRemoveScreen}
      />

      {/* E) Simulador de cambios */}
      <div id="proration-simulator">
        <ProrationSimulator
          subscription={subscription}
          currentScreens={screens.length}
          onConfirmChange={handleConfirmChange}
        />
      </div>

      {/* D) Facturación */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PaymentMethodCard
            methods={paymentMethods}
            onAddMethod={handleAddPaymentMethod}
            onEditMethod={() => handleAddPaymentMethod()}
          />
        </div>
        <div className="lg:col-span-2" ref={invoicesRef}>
          <InvoicesList invoices={invoices} legacyPayments={payments} />
        </div>
      </div>

      {/* Checkout Modal */}
      {pendingChange && (
        <ImmediateChargeModal
          open={chargeModalOpen}
          onOpenChange={setChargeModalOpen}
          immediateCharge={pendingChange.immediateCharge}
          nextCycleTotal={pendingChange.nextCycleTotal}
          newScreenCount={pendingChange.newCount}
          billingAnchor={subscription ? new Date(subscription.billing_anchor) : new Date()}
          saving={saving}
          onConfirm={handleCheckout}
        />
      )}
    </div>
  );
};

export default Subscription;
