-- Agregar campos de telemetría a screens
ALTER TABLE public.screens
  ADD COLUMN IF NOT EXISTS app_version text,
  ADD COLUMN IF NOT EXISTS device_model text,
  ADD COLUMN IF NOT EXISTS os_version text,
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Función helper: ¿el usuario es admin de cualquier negocio? (para vista global de flota)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Política adicional: admins ven todas las pantallas (vista global)
CREATE POLICY "Platform admins can view all screens"
ON public.screens
FOR SELECT
USING (public.is_platform_admin());

-- Lo mismo para locations (necesario para joins en el panel)
CREATE POLICY "Platform admins can view all locations"
ON public.locations
FOR SELECT
USING (public.is_platform_admin());

-- Lo mismo para businesses (mostrar nombre del cliente en el panel)
CREATE POLICY "Platform admins can view all businesses"
ON public.businesses
FOR SELECT
USING (public.is_platform_admin());

-- Índice para queries de flota por last_seen
CREATE INDEX IF NOT EXISTS idx_screens_last_seen ON public.screens(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_screens_app_version ON public.screens(app_version);