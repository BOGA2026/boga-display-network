-- Lectura pública (anon y authenticated) para activos de marketing
CREATE POLICY "public_assets_read_anyone"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'public-assets');

-- Escritura exclusiva de administradores de plataforma
CREATE POLICY "public_assets_insert_platform_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets' AND public.is_platform_admin());

CREATE POLICY "public_assets_update_platform_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets' AND public.is_platform_admin())
WITH CHECK (bucket_id = 'public-assets' AND public.is_platform_admin());

CREATE POLICY "public_assets_delete_platform_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets' AND public.is_platform_admin());