
-- Add license tracking fields to screens
ALTER TABLE public.screens 
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id),
  ADD COLUMN IF NOT EXISTS activated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS payment_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS license_status text NOT NULL DEFAULT 'active';

-- Add grace period tracking to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamp with time zone;
