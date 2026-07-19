
-- 1. Storage: media bucket — ownership-scoped writes
DROP POLICY IF EXISTS "Admin/Editor can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Editor can delete media" ON storage.objects;

CREATE POLICY "Business members can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Business members can update own media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Business members can delete own media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
);

-- 2. Storage: downloads bucket — restrict writes to platform admins, restrict SELECT to known public file
DROP POLICY IF EXISTS "Authenticated can upload downloads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update downloads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete downloads" ON storage.objects;
DROP POLICY IF EXISTS "Public can read downloads" ON storage.objects;

CREATE POLICY "Public can read published APK"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'downloads'
  AND name = 'visualia-firetv.apk'
);

CREATE POLICY "Platform admins manage downloads insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'downloads' AND public.is_platform_admin());

CREATE POLICY "Platform admins manage downloads update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'downloads' AND public.is_platform_admin())
WITH CHECK (bucket_id = 'downloads' AND public.is_platform_admin());

CREATE POLICY "Platform admins manage downloads delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'downloads' AND public.is_platform_admin());

-- 3. demo_requests: server-side validation via CHECK constraints + tightened INSERT policy
-- Length + format enforcement (immutable, so safe as CHECK).
ALTER TABLE public.demo_requests
  ADD CONSTRAINT demo_requests_name_len CHECK (char_length(name) BETWEEN 1 AND 120),
  ADD CONSTRAINT demo_requests_phone_len CHECK (char_length(phone) BETWEEN 5 AND 40),
  ADD CONSTRAINT demo_requests_email_len CHECK (char_length(email) BETWEEN 5 AND 254),
  ADD CONSTRAINT demo_requests_email_fmt CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT demo_requests_business_len CHECK (char_length(business_name) BETWEEN 1 AND 160),
  ADD CONSTRAINT demo_requests_city_len CHECK (char_length(city) BETWEEN 1 AND 120),
  ADD CONSTRAINT demo_requests_message_len CHECK (message IS NULL OR char_length(message) <= 2000),
  ADD CONSTRAINT demo_requests_range_len CHECK (screens_range IS NULL OR char_length(screens_range) <= 40);

-- Replace permissive INSERT policy with one that still allows public submissions but
-- also documents required consent and enforces basic guard on payload shape.
DROP POLICY IF EXISTS "Anyone can submit demo requests" ON public.demo_requests;
CREATE POLICY "Public can submit demo requests"
ON public.demo_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  consent = true
  AND char_length(name) BETWEEN 1 AND 120
  AND char_length(email) BETWEEN 5 AND 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- 4. Harden get_user_business_id with explicit NULL guard
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT business_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND auth.uid() IS NOT NULL
$function$;

-- 5. Lock down SECURITY DEFINER helper execution: revoke anon EXECUTE
REVOKE EXECUTE ON FUNCTION public.get_user_business_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member_of_business(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role_in_business(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_business(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_locations_screens(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_content_playlists(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_user_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_of_business(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role_in_business(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_business(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_locations_screens(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_content_playlists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
