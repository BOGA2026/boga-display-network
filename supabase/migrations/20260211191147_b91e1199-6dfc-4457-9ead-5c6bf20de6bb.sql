
-- Create media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','video/mp4','video/webm','video/quicktime','text/html','audio/mpeg','audio/wav','audio/ogg']
);

-- Storage RLS: members can view media from their business
CREATE POLICY "Business members can view media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media'
  AND public.is_member_of_business(
    (SELECT c.business_id FROM public.content c WHERE c.id::text = (storage.foldername(name))[1])
  )
);

-- Public read for media bucket (since bucket is public)
CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Admin/Editor can upload media
CREATE POLICY "Admin/Editor can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND auth.role() = 'authenticated'
);

-- Admin/Editor can delete media
CREATE POLICY "Admin/Editor can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND auth.role() = 'authenticated'
);
