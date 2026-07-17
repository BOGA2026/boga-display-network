
-- 1. Tabla de admins generales de la plataforma (independiente de business_memberships)
CREATE TABLE public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id)
);

GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Solo los propios admins pueden ver la tabla
CREATE POLICY "Platform admins can view platform_admins"
  ON public.platform_admins FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()));

-- 2. Lista de correos pre-aprobados (para asignar admin al registrarse)
CREATE TABLE public.platform_admin_allowlist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_admin_allowlist TO authenticated;
GRANT ALL ON public.platform_admin_allowlist TO service_role;

ALTER TABLE public.platform_admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage allowlist"
  ON public.platform_admin_allowlist FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()));

-- Pre-aprobar el correo solicitado
INSERT INTO public.platform_admin_allowlist (email) VALUES ('produccion@bogacasadecontenidos.com');

-- 3. Reemplazar is_platform_admin() para que use la nueva tabla
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  )
$$;

-- 4. Trigger: cuando un correo de la allowlist confirme su email, se marca como admin
CREATE OR REPLACE FUNCTION public.grant_platform_admin_if_allowed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.platform_admin_allowlist WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.platform_admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_platform_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_platform_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_platform_admin_if_allowed();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_platform_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_platform_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_platform_admin_if_allowed();
