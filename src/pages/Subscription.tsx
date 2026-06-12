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
import { calculateMonthlyTotal } from "@/lib/proration";

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
      const unitPrice = getUnitPrice(pendingChange.newCount);

      if (subscription) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            screens_count: pendingChange.newCount,
            price_per_screen: unitPrice,
            total_amount: pendingChange.nextCycleTotal,
            status: "active",
          })
          .eq("id", subscription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          business_id: businessId,
          plan: "visualia",
          screens_count: pendingChange.newCount,
          billing_cycle: "monthly",
          price_per_screen: unitPrice,
          total_amount: pendingChange.nextCycleTotal,
          status: "active",
        });
        if (error) throw error;
      }

      // Create invoice if there's an immediate charge
      if (pendingChange.immediateCharge > 0) {
        const subId = subscription?.id ?? (
          await supabase.from("subscriptions").select("id").eq("business_id", businessId).single()
        ).data?.id;

        if (subId) {
          const invoiceNum = `VIS-${Date.now().toString(36).toUpperCase()}`;
          await supabase.from("invoices").insert({
            subscription_id: subId,
            business_id: businessId,
            invoice_number: invoiceNum,
            subtotal: pendingChange.immediateCharge,
            total: pendingChange.immediateCharge,
            status: "paid",
            paid_at: new Date().toISOString(),
            notes: `Prorrateo por ${pendingChange.newCount - (subscription?.screens_count ?? 0)} pantalla(s) nueva(s)`,
          });
        }
      }

      toast({ title: "¡Suscripción actualizada!", description: `${pendingChange.newCount} pantallas configuradas.` });
      setChargeModalOpen(false);
      setPendingChange(null);
      refetch();
    } catch (err: any) {
      toast({ title: "Error al procesar", description: err.message, variant: "destructive" });
    } finally {
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
    toast({ title: "Próximamente", description: "La integración con pasarela de pago estará disponible pronto." });
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
