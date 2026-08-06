
-- 1) Lead / marketing data: platform admins only
DROP POLICY IF EXISTS "admin read notifications" ON public.advisor_notifications;
CREATE POLICY "Platform admins read advisor notifications"
ON public.advisor_notifications FOR SELECT TO authenticated
USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Only admins can view demo requests" ON public.demo_requests;
CREATE POLICY "Platform admins read demo requests"
ON public.demo_requests FOR SELECT TO authenticated
USING (public.is_platform_admin());

DROP POLICY IF EXISTS "admin read lead_events" ON public.lead_events;
CREATE POLICY "Platform admins read lead events"
ON public.lead_events FOR SELECT TO authenticated
USING (public.is_platform_admin());

DROP POLICY IF EXISTS "admin read leads" ON public.leads;
CREATE POLICY "Platform admins read leads"
ON public.leads FOR SELECT TO authenticated
USING (public.is_platform_admin());

-- 2) device_orders: prevent tenant hopping + reserve fulfillment fields
DROP POLICY IF EXISTS "Managers update device orders" ON public.device_orders;
CREATE POLICY "Managers update device orders"
ON public.device_orders FOR UPDATE TO authenticated
USING (public.can_manage_business(business_id) OR public.is_platform_admin())
WITH CHECK (public.can_manage_business(business_id) OR public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.guard_device_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.business_id IS DISTINCT FROM OLD.business_id THEN
    RAISE EXCEPTION 'no se puede mover una orden a otro negocio';
  END IF;
  -- fulfillment fields are managed by Visualia only
  NEW.status := OLD.status;
  NEW.tracking_code := OLD.tracking_code;
  NEW.price_cop := OLD.price_cop;
  NEW.included := OLD.included;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_device_order_update ON public.device_orders;
CREATE TRIGGER trg_guard_device_order_update
BEFORE UPDATE ON public.device_orders
FOR EACH ROW EXECUTE FUNCTION public.guard_device_order_update();

-- 3) media bucket: require well-formed <business_uuid>/<file> paths
DROP POLICY IF EXISTS "Business members can upload media" ON storage.objects;
CREATE POLICY "Business members can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND array_length(storage.foldername(name), 1) >= 1
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Business members can update own media" ON storage.objects;
CREATE POLICY "Business members can update own media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Business members can delete own media" ON storage.objects;
CREATE POLICY "Business members can delete own media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
);

-- 4) public-assets: only the explicit public/ prefix is world-readable
DROP POLICY IF EXISTS "public_assets_read_anyone" ON storage.objects;
CREATE POLICY "public_assets_read_public_prefix"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'public-assets'
  AND (storage.foldername(name))[1] = 'public'
);

CREATE POLICY "public_assets_read_platform_admin"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'public-assets' AND public.is_platform_admin());
