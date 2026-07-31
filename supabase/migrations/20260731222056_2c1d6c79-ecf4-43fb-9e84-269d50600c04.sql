
-- 1 + 2: horas al aire vs. programadas y escaneos por hora al aire
CREATE OR REPLACE FUNCTION public.analytics_airtime(
  p_business_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
RETURNS TABLE(
  minutes_online bigint,
  minutes_expected bigint,
  scans bigint,
  scans_per_hour numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  with biz_screens as (
    select s.id
    from screens s
    join locations l on l.id = s.location_id
    where l.business_id = p_business_id
      and public.is_member_of_business(p_business_id)
  ),
  days as (
    select d::date as day
    from generate_series(p_from::date, greatest(p_from::date, (p_to::date - 1)), interval '1 day') d
  ),
  -- Minutos programados reales: una pantalla apagada de noche a propósito
  -- no está caída, por eso nunca se asume 1440.
  sched as (
    select bs.id as screen_id,
           dd.day,
           sum(greatest(0, extract(epoch from (b.end_time - b.start_time)) / 60))::bigint as mins
    from biz_screens bs
    cross join days dd
    join schedule_blocks b
      on b.screen_id = bs.id
     and b.is_enabled
     and extract(dow from dd.day)::int = any(b.days_of_week)
     and (b.start_date is null or dd.day >= b.start_date)
     and (b.end_date is null or dd.day <= b.end_date)
    group by 1, 2
  ),
  uptime as (
    select u.screen_id, u.day, u.minutes_online, u.minutes_expected
    from daily_screen_uptime u
    where u.screen_id in (select id from biz_screens)
      and u.day >= p_from::date and u.day < p_to::date
  ),
  combined as (
    select bs.id as screen_id,
           dd.day,
           coalesce(up.minutes_online, 0)::bigint as online,
           -- Programación real; si esa pantalla no tiene bloques, se usa lo
           -- que ya venía registrado en el rollup diario.
           coalesce(sc.mins, up.minutes_expected, 0)::bigint as expected
    from biz_screens bs
    cross join days dd
    left join sched sc on sc.screen_id = bs.id and sc.day = dd.day
    left join uptime up on up.screen_id = bs.id and up.day = dd.day
  ),
  totals as (
    select coalesce(sum(least(online, greatest(expected, online))), 0)::bigint as online_min,
           coalesce(sum(expected), 0)::bigint as expected_min
    from combined
  ),
  qr as (
    select count(*)::bigint as n
    from qr_scans qs
    join qr_codes qc on qc.id = qs.qr_code_id
    where qc.business_id = p_business_id
      and qs.scanned_at >= p_from and qs.scanned_at < p_to
  )
  select t.online_min,
         t.expected_min,
         q.n,
         case when t.online_min > 0
              then round(q.n::numeric / (t.online_min::numeric / 60), 1)
              else null
         end
  from totals t cross join qr q;
$$;

-- 3: contenido huérfano (sin reproducciones en el periodo)
CREATE OR REPLACE FUNCTION public.analytics_orphan_content(
  p_business_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
RETURNS TABLE(
  content_id uuid,
  name text,
  thumbnail_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select c.id, c.name, c.thumbnail_url, c.created_at
  from content c
  where c.business_id = p_business_id
    and public.is_member_of_business(p_business_id)
    and not exists (
      select 1 from playback_events pe
      where pe.content_id = c.id
        and pe.started_at >= p_from and pe.started_at < p_to
    )
  order by c.created_at asc;
$$;

-- Días de telemetría disponibles: antes de 7 días todo parecería huérfano.
CREATE OR REPLACE FUNCTION public.analytics_telemetry_days(p_business_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select case
    when not public.is_member_of_business(p_business_id) then 0
    else coalesce((
      select greatest(
        coalesce((
          select count(distinct u.day)
          from daily_screen_uptime u
          join screens s on s.id = u.screen_id
          join locations l on l.id = s.location_id
          where l.business_id = p_business_id
        ), 0),
        coalesce((
          select count(distinct pe.started_at::date)
          from playback_events pe
          join screens s on s.id = pe.screen_id
          join locations l on l.id = s.location_id
          where l.business_id = p_business_id
        ), 0)
      )::int
    ), 0)
  end;
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_airtime(uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.analytics_orphan_content(uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.analytics_telemetry_days(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_airtime(uuid, timestamptz, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.analytics_orphan_content(uuid, timestamptz, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.analytics_telemetry_days(uuid) TO authenticated, service_role;
