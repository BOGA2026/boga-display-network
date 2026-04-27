-- Crear bucket público para descargas (APK Fire TV, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'downloads',
  'downloads',
  true,
  104857600, -- 100 MB
  ARRAY['application/vnd.android.package-archive', 'application/octet-stream', 'application/zip']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 104857600,
      allowed_mime_types = ARRAY['application/vnd.android.package-archive', 'application/octet-stream', 'application/zip'];

-- Lectura pública: cualquiera puede descargar
CREATE POLICY "Public can read downloads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'downloads');

-- Solo usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated can upload downloads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'downloads');

-- Solo usuarios autenticados pueden actualizar
CREATE POLICY "Authenticated can update downloads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'downloads');

-- Solo usuarios autenticados pueden eliminar
CREATE POLICY "Authenticated can delete downloads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'downloads');