-- 1. Remove blanket public listing/read policy on the media bucket
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

-- 2. Tighten always-true insert policy on businesses
DROP POLICY IF EXISTS "Authenticated users can create a business" ON public.businesses;
CREATE POLICY "Authenticated users can create a business"
ON public.businesses FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Revoke EXECUTE on SECURITY DEFINER functions from anon/PUBLIC
REVOKE ALL ON FUNCTION public.grant_platform_admin_if_allowed() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_device_status_transition() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.support_bump_thread() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purge_demo_analytics(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.seed_demo_analytics(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rollup_screen_uptime(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sweep_offline_devices(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_business(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_content_playlists(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_locations_screens(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_business_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role_in_business(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_member_of_business(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_manage_business(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_content_playlists(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_locations_screens(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_business_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role_in_business(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_of_business(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purge_demo_analytics(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.seed_demo_analytics(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rollup_screen_uptime(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.sweep_offline_devices(integer) TO service_role;

-- 4. Validate qr_codes target_url scheme (prevents javascript:/data: redirects)
CREATE OR REPLACE FUNCTION public.validate_qr_code_target()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.target_url IS NOT NULL AND NEW.target_url !~* '^https?://[^\s]+$' THEN
    RAISE EXCEPTION 'target_url must be a valid http(s) URL';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_qr_code_target_trg ON public.qr_codes;
CREATE TRIGGER validate_qr_code_target_trg
BEFORE INSERT OR UPDATE ON public.qr_codes
FOR EACH ROW EXECUTE FUNCTION public.validate_qr_code_target();