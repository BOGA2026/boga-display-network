-- 1) SECURITY DEFINER function should not be callable by anonymous users
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text, text) TO authenticated;

-- 2) ai_generations: updates limited to the creator or business managers
DROP POLICY IF EXISTS "Editors update own generations" ON public.ai_generations;
CREATE POLICY "Editors update own generations"
ON public.ai_generations
FOR UPDATE
TO authenticated
USING (
  is_member_of_business(business_id)
  AND (user_id = auth.uid() OR can_manage_business(business_id))
)
WITH CHECK (
  is_member_of_business(business_id)
  AND (user_id = auth.uid() OR can_manage_business(business_id))
);

-- 3) menu_templates: global catalog, but only for signed-in users
REVOKE ALL ON public.menu_templates FROM anon;
GRANT SELECT ON public.menu_templates TO authenticated;
GRANT ALL ON public.menu_templates TO service_role;

-- 4) downloads bucket: only platform admins may write, and only the official APK
DROP POLICY IF EXISTS "Platform admins manage downloads insert" ON storage.objects;
CREATE POLICY "Platform admins manage downloads insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'downloads'
  AND public.is_platform_admin()
  AND name ~ '^[a-z0-9._-]+\.apk$'
);

DROP POLICY IF EXISTS "Platform admins manage downloads update" ON storage.objects;
CREATE POLICY "Platform admins manage downloads update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'downloads' AND public.is_platform_admin())
WITH CHECK (
  bucket_id = 'downloads'
  AND public.is_platform_admin()
  AND name ~ '^[a-z0-9._-]+\.apk$'
);

-- Public read stays limited to the single published APK object
DROP POLICY IF EXISTS "Public can read published APK" ON storage.objects;
CREATE POLICY "Public can read published APK"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'downloads' AND name = 'visualia-firetv.apk');
