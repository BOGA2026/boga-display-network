ALTER TABLE public.screens
  ADD COLUMN IF NOT EXISTS device_type text NOT NULL DEFAULT 'desconocido';

ALTER TABLE public.screens
  DROP CONSTRAINT IF EXISTS screens_device_type_check;
ALTER TABLE public.screens
  ADD CONSTRAINT screens_device_type_check
  CHECK (device_type IN ('tv_google', 'dispositivo_externo', 'desconocido'));

CREATE TABLE IF NOT EXISTS public.device_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  screen_id uuid REFERENCES public.screens(id) ON DELETE SET NULL,
  requested_by uuid,
  model_id text,
  model_name text,
  price_cop integer NOT NULL DEFAULT 0,
  included boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pendiente',
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  notes text,
  tracking_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT device_orders_status_check
    CHECK (status IN ('pendiente', 'configurando', 'enviado', 'entregado', 'cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_device_orders_business ON public.device_orders (business_id);

GRANT SELECT, INSERT, UPDATE ON public.device_orders TO authenticated;
GRANT ALL ON public.device_orders TO service_role;

ALTER TABLE public.device_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read device orders"
ON public.device_orders FOR SELECT TO authenticated
USING (public.is_member_of_business(business_id) OR public.is_platform_admin());

CREATE POLICY "Managers create device orders"
ON public.device_orders FOR INSERT TO authenticated
WITH CHECK (public.can_manage_business(business_id) AND requested_by = auth.uid());

CREATE POLICY "Managers update device orders"
ON public.device_orders FOR UPDATE TO authenticated
USING (public.can_manage_business(business_id) OR public.is_platform_admin())
WITH CHECK (public.can_manage_business(business_id) OR public.is_platform_admin());

CREATE TRIGGER update_device_orders_updated_at
BEFORE UPDATE ON public.device_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();