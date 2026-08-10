-- 1) business_memberships: self-signup solo para negocio recién creado, como owner
DROP POLICY IF EXISTS "Self membership on signup" ON public.business_memberships;
CREATE POLICY "Self ownership on new business"
ON public.business_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'owner'::public.app_role
  AND NOT EXISTS (
    SELECT 1 FROM public.business_memberships m
    WHERE m.business_id = business_memberships.business_id
  )
);

-- 2) device_orders: política de borrado explícita y acotada
CREATE POLICY "Managers delete pending device orders"
ON public.device_orders
FOR DELETE
TO authenticated
USING (
  public.is_platform_admin()
  OR (public.can_manage_business(business_id) AND status IN ('pending','draft','requested'))
);

-- 3) menu_templates: solo integrantes de algún negocio
DROP POLICY IF EXISTS "Authenticated users can view menu templates" ON public.menu_templates;
CREATE POLICY "Business members can view menu templates"
ON public.menu_templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_memberships m
    WHERE m.user_id = auth.uid()
  )
);

-- 4) exit_offer_*: sin ejecución anónima; el acceso público pasa por edge function
REVOKE ALL ON FUNCTION public.exit_offer_claim(text) FROM anon, public;
REVOKE ALL ON FUNCTION public.exit_offer_get(text) FROM anon, public;
REVOKE ALL ON FUNCTION public.exit_offer_mark(text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.exit_offer_claim(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exit_offer_get(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exit_offer_mark(text, text) TO service_role;