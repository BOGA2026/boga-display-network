import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionRow {
  id: string;
  plan: string;
  screens_count: number;
  billing_cycle: string;
  price_per_screen: number;
  total_amount: number;
  status: string;
  next_billing_date: string;
  billing_anchor: string;
  expires_at: string | null;
  grace_period_ends_at: string | null;
}

export interface ScreenItem {
  id: string;
  name: string;
  status: string;
  activated_at: string | null;
  payment_expires_at: string | null;
  license_status: string;
  location_name?: string;
}

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface PaymentMethodRow {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export function useSubscriptionData() {
  return useQuery({
    queryKey: ["subscription-full"],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("No user");

      const profile = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();

      const businessId = profile.data?.business_id;
      if (!businessId) return { businessId: null, subscription: null, screens: [], invoices: [], paymentMethods: [], payments: [] };

      const [subRes, screensRes, invoicesRes, pmRes, paymentsRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("business_id", businessId).maybeSingle(),
        supabase
          .from("screens")
          .select("id, name, status, activated_at, payment_expires_at, license_status, location_id, locations(name)")
          .order("created_at", { ascending: true }),
        supabase.from("invoices").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
        supabase.from("payment_methods").select("*").eq("business_id", businessId),
        supabase.from("payments").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
      ]);

      const screens: ScreenItem[] = (screensRes.data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        activated_at: s.activated_at,
        payment_expires_at: s.payment_expires_at,
        license_status: s.license_status,
        location_name: s.locations?.name ?? "—",
      }));

      return {
        businessId,
        subscription: subRes.data as SubscriptionRow | null,
        screens,
        invoices: (invoicesRes.data ?? []) as InvoiceRow[],
        paymentMethods: (pmRes.data ?? []) as PaymentMethodRow[],
        payments: (paymentsRes.data ?? []) as any[],
      };
    },
    refetchInterval: 30000,
  });
}
