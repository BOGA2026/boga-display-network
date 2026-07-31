-- Todas SECURITY INVOKER: la RLS se sigue evaluando con el usuario real,
-- por lo que el aislamiento entre negocios se mantiene intacto.

create or replace function public.get_tenant()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'business_id', p.business_id,
    'business_name', b.name,
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

create or replace function public.get_screens_page()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with biz as (select business_id from profiles where id = auth.uid())
  select jsonb_build_object(
    'screens', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from (
        select s.id, s.name, s.status, s.location_id, s.device_token,
               s.last_seen_at, s.created_at
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
$$;

create or replace function public.get_dashboard_page()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with biz as (select business_id from profiles where id = auth.uid())
  select jsonb_build_object(
    'business_id', (select business_id from biz),
    'screens', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.name)
      from (
        select s.id, s.name, s.status, s.last_seen_at, s.location_id,
               s.license_status,
               (select to_jsonb(lt) from (
                  select l.id, l.name, l.latitude, l.longitude
                  from locations l where l.id = s.location_id
                ) lt) as locations
        from screens s
      ) t
    ), '[]'::jsonb),
    'locations_count', (
      select count(*) from locations l
      where l.business_id = (select business_id from biz)
    ),
    'content_count', (select count(*) from content),
    'playlists_count', (select count(*) from playlists),
    'schedules_count', (
      select count(*) from schedule_blocks sb where sb.is_enabled
    ),
    'devices', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.last_seen_at desc nulls last)
      from (
        select d.id, d.status, d.last_seen_at, d.screen_name, d.paired_at
        from devices d
        order by d.last_seen_at desc nulls last
        limit 10
      ) t
    ), '[]'::jsonb),
    'subscription', (
      select to_jsonb(t)
      from (
        select sub.status, sub.expires_at, sub.grace_period_ends_at
        from subscriptions sub
        limit 1
      ) t
    )
  );
$$;

create or replace function public.get_content_page()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'content', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from (
        select c.id, c.name, c.type, c.file_url, c.thumbnail_url,
               c.duration_seconds, c.created_at
        from content c
      ) t
    ), '[]'::jsonb),
    'playlists', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from (
        select pl.id, pl.name, pl.created_at,
               (select count(*) from playlist_items pi where pi.playlist_id = pl.id) as items_count
        from playlists pl
      ) t
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_tenant() from public, anon;
revoke all on function public.get_screens_page() from public, anon;
revoke all on function public.get_dashboard_page() from public, anon;
revoke all on function public.get_content_page() from public, anon;

grant execute on function public.get_tenant() to authenticated;
grant execute on function public.get_screens_page() to authenticated;
grant execute on function public.get_dashboard_page() to authenticated;
grant execute on function public.get_content_page() to authenticated;