REVOKE ALL ON FUNCTION public.activate_platform_admin(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.invite_platform_admin(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_platform_admin_invite(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_platform_admin(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_platform_admin_access() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_platform_admin_event(text, text, uuid, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.business_usage(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.guard_device_order_update() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.activate_platform_admin(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_platform_admin(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_platform_admin_invite(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_platform_admin(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_platform_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_usage(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins can update blocks" ON public.schedule_blocks;
CREATE POLICY "Admins can update blocks"
ON public.schedule_blocks
FOR UPDATE
TO authenticated
USING (public.can_manage_business(business_id))
WITH CHECK (public.can_manage_business(business_id));

DROP POLICY IF EXISTS "Admins can insert blocks" ON public.schedule_blocks;
CREATE POLICY "Admins can insert blocks"
ON public.schedule_blocks
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_business(business_id));

DROP POLICY IF EXISTS "Admins can delete blocks" ON public.schedule_blocks;
CREATE POLICY "Admins can delete blocks"
ON public.schedule_blocks
FOR DELETE
TO authenticated
USING (public.can_manage_business(business_id));

DROP POLICY IF EXISTS "Members can view blocks" ON public.schedule_blocks;
CREATE POLICY "Members can view blocks"
ON public.schedule_blocks
FOR SELECT
TO authenticated
USING (public.is_member_of_business(business_id));