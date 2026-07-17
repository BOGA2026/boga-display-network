
CREATE POLICY "Platform admins view all screen commands" ON public.screen_commands FOR SELECT
  USING (public.is_platform_admin());
CREATE POLICY "Platform admins insert screen commands" ON public.screen_commands FOR INSERT
  WITH CHECK (public.is_platform_admin());
