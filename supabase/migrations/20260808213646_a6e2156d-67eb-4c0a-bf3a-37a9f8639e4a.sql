DROP POLICY IF EXISTS "Business members can view media" ON storage.objects;

CREATE POLICY "Business members can view media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.is_member_of_business(((storage.foldername(name))[1])::uuid)
);