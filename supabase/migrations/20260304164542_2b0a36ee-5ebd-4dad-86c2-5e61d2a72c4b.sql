
-- Add billing_anchor to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_anchor date NOT NULL DEFAULT (now()::date);

-- Subscription items: links screens to subscriptions with per-screen pricing
CREATE TABLE public.subscription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  screen_id uuid NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  unit_price numeric NOT NULL DEFAULT 50000,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, screen_id)
);

-- Prorations table
CREATE TABLE public.prorations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_item_id uuid NOT NULL REFERENCES public.subscription_items(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'COP',
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices table (separate from payments)
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'COP',
  status text NOT NULL DEFAULT 'pending',
  due_date date NOT NULL DEFAULT (now()::date + 5),
  paid_at timestamptz,
  pdf_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payment methods table
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  brand text NOT NULL DEFAULT 'visa',
  last4 text NOT NULL DEFAULT '0000',
  exp_month integer NOT NULL DEFAULT 1,
  exp_year integer NOT NULL DEFAULT 2030,
  is_default boolean NOT NULL DEFAULT true,
  provider text NOT NULL DEFAULT 'manual',
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS for subscription_items (via subscription -> business)
CREATE POLICY "Members can view subscription items" ON public.subscription_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_items.subscription_id AND is_member_of_business(s.business_id)
  ));

CREATE POLICY "Admins can insert subscription items" ON public.subscription_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_items.subscription_id AND can_manage_business(s.business_id)
  ));

CREATE POLICY "Admins can update subscription items" ON public.subscription_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_items.subscription_id AND can_manage_business(s.business_id)
  ));

CREATE POLICY "Admins can delete subscription items" ON public.subscription_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_items.subscription_id AND can_manage_business(s.business_id)
  ));

-- RLS for prorations (via subscription_items -> subscription -> business)
CREATE POLICY "Members can view prorations" ON public.prorations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.subscription_items si
    JOIN public.subscriptions s ON s.id = si.subscription_id
    WHERE si.id = prorations.subscription_item_id AND is_member_of_business(s.business_id)
  ));

CREATE POLICY "Admins can insert prorations" ON public.prorations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subscription_items si
    JOIN public.subscriptions s ON s.id = si.subscription_id
    WHERE si.id = prorations.subscription_item_id AND can_manage_business(s.business_id)
  ));

-- RLS for invoices
CREATE POLICY "Members can view invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (is_member_of_business(business_id));

CREATE POLICY "Admins can insert invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (can_manage_business(business_id));

CREATE POLICY "Admins can update invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (can_manage_business(business_id));

-- RLS for payment_methods
CREATE POLICY "Members can view payment methods" ON public.payment_methods
  FOR SELECT TO authenticated
  USING (is_member_of_business(business_id));

CREATE POLICY "Admins can manage payment methods" ON public.payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (can_manage_business(business_id));

CREATE POLICY "Admins can update payment methods" ON public.payment_methods
  FOR UPDATE TO authenticated
  USING (can_manage_business(business_id));

CREATE POLICY "Admins can delete payment methods" ON public.payment_methods
  FOR DELETE TO authenticated
  USING (can_manage_business(business_id));
