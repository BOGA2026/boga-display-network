
-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter',
  screens_count integer NOT NULL DEFAULT 1,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  price_per_screen numeric NOT NULL DEFAULT 50000,
  total_amount numeric NOT NULL DEFAULT 50000,
  status text NOT NULL DEFAULT 'active',
  next_billing_date date NOT NULL DEFAULT (now() + interval '30 days')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_plan CHECK (plan IN ('starter', 'pro', 'enterprise')),
  CONSTRAINT valid_cycle CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'past_due', 'cancelled'))
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view subscription" ON public.subscriptions
  FOR SELECT USING (is_member_of_business(business_id));

CREATE POLICY "Admins can insert subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (can_manage_business(business_id));

CREATE POLICY "Admins can update subscription" ON public.subscriptions
  FOR UPDATE USING (can_manage_business(business_id));

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'card',
  invoice_number text NOT NULL,
  billing_name text,
  tax_id text,
  billing_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view payments" ON public.payments
  FOR SELECT USING (is_member_of_business(business_id));

CREATE POLICY "Admins can insert payments" ON public.payments
  FOR INSERT WITH CHECK (can_manage_business(business_id));
