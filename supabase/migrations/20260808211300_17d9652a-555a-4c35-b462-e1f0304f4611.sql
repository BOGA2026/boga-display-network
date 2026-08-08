ALTER TABLE public.brand_kits
  ADD COLUMN IF NOT EXISTS logo_dark_url text,
  ADD COLUMN IF NOT EXISTS logo_light_url text,
  ADD COLUMN IF NOT EXISTS logo_symbol_url text,
  ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#0B0B0F',
  ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS extra_color text,
  ADD COLUMN IF NOT EXISTS heading_font text,
  ADD COLUMN IF NOT EXISTS body_font text;

CREATE TABLE IF NOT EXISTS public.brand_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Foto',
  url text NOT NULL,
  tag text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_photos TO authenticated;
GRANT ALL ON public.brand_photos TO service_role;

ALTER TABLE public.brand_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_photos_select_members" ON public.brand_photos
  FOR SELECT TO authenticated
  USING (public.is_member_of_business(business_id));

CREATE POLICY "brand_photos_insert_editors" ON public.brand_photos
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_content_playlists(business_id));

CREATE POLICY "brand_photos_update_editors" ON public.brand_photos
  FOR UPDATE TO authenticated
  USING (public.can_manage_content_playlists(business_id))
  WITH CHECK (public.can_manage_content_playlists(business_id));

CREATE POLICY "brand_photos_delete_editors" ON public.brand_photos
  FOR DELETE TO authenticated
  USING (public.can_manage_content_playlists(business_id));

CREATE INDEX IF NOT EXISTS brand_photos_business_idx ON public.brand_photos (business_id, created_at DESC);