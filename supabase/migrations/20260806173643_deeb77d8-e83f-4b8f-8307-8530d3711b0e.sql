
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS default_duration_seconds integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS default_expiry_days integer DEFAULT 30;

ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_content_business_expires ON public.content (business_id, expires_at);

CREATE OR REPLACE FUNCTION public.business_usage(p_business_id uuid)
RETURNS TABLE(
  used_bytes bigint,
  content_count bigint,
  screens_used bigint,
  screens_licensed integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT SUM(c.file_size_bytes) FROM public.content c WHERE c.business_id = p_business_id), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.content c WHERE c.business_id = p_business_id), 0)::bigint,
    COALESCE((
      SELECT COUNT(*) FROM public.screens s
      JOIN public.locations l ON l.id = s.location_id
      WHERE l.business_id = p_business_id
    ), 0)::bigint,
    COALESCE((
      SELECT sub.screens_count FROM public.subscriptions sub
      WHERE sub.business_id = p_business_id
      ORDER BY sub.created_at DESC LIMIT 1
    ), 0)
  WHERE public.is_member_of_business(p_business_id);
$$;

GRANT EXECUTE ON FUNCTION public.business_usage(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_tenant()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'business_id', p.business_id,
    'business_name', b.name,
    'timezone', coalesce(b.timezone, 'America/Bogota'),
    'category', b.category,
    'city', b.city,
    'logo_url', b.logo_url,
    'default_duration_seconds', coalesce(b.default_duration_seconds, 15),
    'default_expiry_days', b.default_expiry_days,
    'role', (
      select bm.role::text
      from business_memberships bm
      where bm.user_id = auth.uid()
        and bm.business_id = p.business_id
      limit 1
    )
  )
  from profiles p
  left join businesses b on b.id = p.business_id
  where p.id = auth.uid();
$$;
