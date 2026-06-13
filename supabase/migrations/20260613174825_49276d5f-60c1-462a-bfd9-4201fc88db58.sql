
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'wompi',
  ADD COLUMN IF NOT EXISTS provider_ref text,
  ADD COLUMN IF NOT EXISTS external_reference text,
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS payments_external_reference_key
  ON public.payments(external_reference) WHERE external_reference IS NOT NULL;

ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS token text,
  ADD COLUMN IF NOT EXISTS customer_email text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS default_payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- Allow service_role full access (used by edge functions/webhook)
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.invoices TO service_role;
GRANT ALL ON public.payment_methods TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.screens TO service_role;
