CREATE OR REPLACE FUNCTION public.get_screens_page()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with biz as (select business_id from profiles where id = auth.uid())
  select jsonb_build_object(
    'screens', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from (
        select s.id, s.name, s.status, s.location_id, s.device_token,
               s.last_seen_at, s.created_at, s.rotation, s.device_type
        from screens s
      ) t
    ), '[]'::jsonb),
    'locations', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.name)
      from (
        select l.id, l.name
        from locations l
        where l.business_id = (select business_id from biz)
      ) t
    ), '[]'::jsonb),
    'subscription', (
      select to_jsonb(t)
      from (
        select sub.screens_count, sub.plan, sub.status,
               sub.expires_at, sub.grace_period_ends_at
        from subscriptions sub
        where sub.business_id = (select business_id from biz)
        limit 1
      ) t
    )
  );
$function$;