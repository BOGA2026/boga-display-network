ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Bogota';
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS timezone text;

CREATE OR REPLACE FUNCTION public.get_tenant()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'business_id', p.business_id,
    'business_name', b.name,
    'timezone', coalesce(b.timezone, 'America/Bogota'),
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
$function$;