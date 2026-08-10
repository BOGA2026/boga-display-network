-- 1) Columnas de borrado lógico
ALTER TABLE public.screens
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS screens_active_idx
  ON public.screens (location_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS devices_active_idx
  ON public.devices (business_id) WHERE deleted_at IS NULL;

-- 2) Las pantallas/dispositivos eliminados desaparecen de toda lectura normal
DROP POLICY IF EXISTS "Members can view screens" ON public.screens;
CREATE POLICY "Members can view screens" ON public.screens
FOR SELECT TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (SELECT 1 FROM public.locations l WHERE l.id = screens.location_id AND public.is_member_of_business(l.business_id))
);

DROP POLICY IF EXISTS "Platform admins can view all screens" ON public.screens;
CREATE POLICY "Platform admins can view all screens" ON public.screens
FOR SELECT TO authenticated
USING (deleted_at IS NULL AND public.is_platform_admin());

DROP POLICY IF EXISTS "Members can view devices" ON public.devices;
CREATE POLICY "Members can view devices" ON public.devices
FOR SELECT TO authenticated
USING (
  deleted_at IS NULL
  AND auth.uid() IS NOT NULL
  AND public.is_member_of_business(business_id)
);

-- 3) Nadie marca deleted_at a mano: se hace por RPC con rol validado
CREATE OR REPLACE FUNCTION public.guard_screen_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    RAISE EXCEPTION 'usa las funciones de eliminar o restaurar pantallas';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_screen_soft_delete ON public.screens;
CREATE TRIGGER trg_guard_screen_soft_delete
BEFORE UPDATE ON public.screens
FOR EACH ROW EXECUTE FUNCTION public.guard_screen_soft_delete();

-- 4) Recalcular cantidad de pantallas del plan
CREATE OR REPLACE FUNCTION public.sync_subscription_screens_count(_business_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  SELECT count(*) INTO _n
  FROM public.screens s
  JOIN public.locations l ON l.id = s.location_id
  WHERE l.business_id = _business_id AND s.deleted_at IS NULL;

  UPDATE public.subscriptions
     SET screens_count = _n, updated_at = now()
   WHERE business_id = _business_id;

  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_subscription_screens_count(uuid) FROM PUBLIC, anon, authenticated;

-- 5) Eliminar (lógico)
CREATE OR REPLACE FUNCTION public.soft_delete_screens(p_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _biz uuid; _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN RAISE EXCEPTION 'sin pantallas'; END IF;

  SELECT DISTINCT l.business_id INTO _biz
  FROM public.screens s JOIN public.locations l ON l.id = s.location_id
  WHERE s.id = ANY(p_ids) AND s.deleted_at IS NULL
  LIMIT 2;

  IF _biz IS NULL THEN RAISE EXCEPTION 'pantallas no encontradas'; END IF;
  IF NOT public.can_manage_business(_biz) THEN RAISE EXCEPTION 'solo el dueño o un administrador puede eliminar pantallas'; END IF;

  UPDATE public.screens s
     SET deleted_at = now(), deleted_by = auth.uid(), status = 'offline', updated_at = now()
   WHERE s.id = ANY(p_ids)
     AND s.deleted_at IS NULL
     AND EXISTS (SELECT 1 FROM public.locations l WHERE l.id = s.location_id AND l.business_id = _biz);
  GET DIAGNOSTICS _count = ROW_COUNT;

  UPDATE public.devices d
     SET deleted_at = now(), deleted_by = auth.uid(), status = 'unlinked', updated_at = now()
   WHERE d.screen_id = ANY(p_ids) AND d.business_id = _biz AND d.deleted_at IS NULL;

  UPDATE public.schedules SET is_active = false WHERE screen_id = ANY(p_ids) AND is_active;
  UPDATE public.schedule_blocks SET is_enabled = false WHERE screen_id = ANY(p_ids) AND is_enabled;

  PERFORM public.sync_subscription_screens_count(_biz);
  PERFORM public.log_audit(_biz, 'screens.deleted', 'screen', NULL,
    jsonb_build_object('ids', to_jsonb(p_ids), 'count', _count));

  RETURN jsonb_build_object('deleted', _count, 'business_id', _biz,
    'screens_count', (SELECT screens_count FROM public.subscriptions WHERE business_id = _biz LIMIT 1));
END;
$$;

-- 6) Restaurar
CREATE OR REPLACE FUNCTION public.restore_screens(p_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _biz uuid; _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT DISTINCT l.business_id INTO _biz
  FROM public.screens s JOIN public.locations l ON l.id = s.location_id
  WHERE s.id = ANY(p_ids) AND s.deleted_at IS NOT NULL
  LIMIT 2;

  IF _biz IS NULL THEN RAISE EXCEPTION 'pantallas no encontradas'; END IF;
  IF NOT public.can_manage_business(_biz) THEN RAISE EXCEPTION 'solo el dueño o un administrador puede restaurar pantallas'; END IF;

  UPDATE public.screens s
     SET deleted_at = NULL, deleted_by = NULL, updated_at = now()
   WHERE s.id = ANY(p_ids)
     AND s.deleted_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.locations l WHERE l.id = s.location_id AND l.business_id = _biz);
  GET DIAGNOSTICS _count = ROW_COUNT;

  UPDATE public.devices d
     SET deleted_at = NULL, deleted_by = NULL, updated_at = now()
   WHERE d.screen_id = ANY(p_ids) AND d.business_id = _biz AND d.deleted_at IS NOT NULL;

  PERFORM public.sync_subscription_screens_count(_biz);
  PERFORM public.log_audit(_biz, 'screens.restored', 'screen', NULL,
    jsonb_build_object('ids', to_jsonb(p_ids), 'count', _count));

  RETURN jsonb_build_object('restored', _count);
END;
$$;

-- 7) Papelera: últimos 30 días
CREATE OR REPLACE FUNCTION public.list_deleted_screens()
RETURNS TABLE(id uuid, name text, location_name text, deleted_at timestamptz, last_seen_at timestamptz, purges_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, l.name, s.deleted_at, s.last_seen_at, s.deleted_at + interval '30 days'
  FROM public.screens s
  JOIN public.locations l ON l.id = s.location_id
  WHERE s.deleted_at IS NOT NULL
    AND s.deleted_at > now() - interval '30 days'
    AND public.is_member_of_business(l.business_id)
  ORDER BY s.deleted_at DESC;
$$;

-- 8) Purga física diaria (>30 días) incluida su telemetría
CREATE OR REPLACE FUNCTION public.purge_deleted_screens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ids uuid[]; _n integer;
BEGIN
  SELECT array_agg(id) INTO _ids FROM public.screens
   WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  IF _ids IS NULL THEN RETURN 0; END IF;

  DELETE FROM public.playback_events WHERE screen_id = ANY(_ids);
  DELETE FROM public.screen_heartbeats WHERE screen_id = ANY(_ids);
  DELETE FROM public.daily_screen_uptime WHERE screen_id = ANY(_ids);
  DELETE FROM public.screen_commands WHERE screen_id = ANY(_ids);
  DELETE FROM public.schedule_blocks WHERE screen_id = ANY(_ids);
  DELETE FROM public.schedules WHERE screen_id = ANY(_ids);
  DELETE FROM public.schedule_publications WHERE screen_id = ANY(_ids);
  DELETE FROM public.subscription_items WHERE screen_id = ANY(_ids);
  UPDATE public.qr_codes SET screen_id = NULL WHERE screen_id = ANY(_ids);
  UPDATE public.qr_scans SET screen_id = NULL WHERE screen_id = ANY(_ids);
  UPDATE public.device_orders SET screen_id = NULL WHERE screen_id = ANY(_ids);
  DELETE FROM public.devices WHERE screen_id = ANY(_ids);
  DELETE FROM public.screens WHERE id = ANY(_ids);
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_deleted_screens() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.soft_delete_screens(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.restore_screens(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_deleted_screens() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_screens(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_screens(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_deleted_screens() TO authenticated;

-- 9) Funciones SECURITY DEFINER: filtrar pantallas eliminadas
CREATE OR REPLACE FUNCTION public.business_usage(p_business_id uuid)
 RETURNS TABLE(used_bytes bigint, content_count bigint, screens_used bigint, screens_licensed integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE((SELECT SUM(c.file_size_bytes) FROM public.content c WHERE c.business_id = p_business_id), 0)::bigint,
    COALESCE((SELECT COUNT(*) FROM public.content c WHERE c.business_id = p_business_id), 0)::bigint,
    COALESCE((
      SELECT COUNT(*) FROM public.screens s
      JOIN public.locations l ON l.id = s.location_id
      WHERE l.business_id = p_business_id AND s.deleted_at IS NULL
    ), 0)::bigint,
    COALESCE((
      SELECT sub.screens_count FROM public.subscriptions sub
      WHERE sub.business_id = p_business_id
      ORDER BY sub.created_at DESC LIMIT 1
    ), 0)
  WHERE public.is_member_of_business(p_business_id);
$function$;

CREATE OR REPLACE FUNCTION public.analytics_airtime(p_business_id uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(minutes_online bigint, minutes_expected bigint, scans bigint, scans_per_hour numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  with biz_screens as (
    select s.id
    from screens s
    join locations l on l.id = s.location_id
    where l.business_id = p_business_id
      and s.deleted_at is null
      and public.is_member_of_business(p_business_id)
  ),
  days as (
    select d::date as day
    from generate_series(p_from::date, greatest(p_from::date, (p_to::date - 1)), interval '1 day') d
  ),
  sched as (
    select bs.id as screen_id, dd.day,
           sum(greatest(0, extract(epoch from (b.end_time - b.start_time)) / 60))::bigint as mins
    from biz_screens bs
    cross join days dd
    join schedule_blocks b
      on b.screen_id = bs.id and b.is_enabled
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
    select bs.id as screen_id, dd.day,
           coalesce(up.minutes_online, 0)::bigint as online,
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
  select t.online_min, t.expected_min, q.n,
         case when t.online_min > 0
              then round(q.n::numeric / (t.online_min::numeric / 60), 1)
              else null end
  from totals t cross join qr q;
$function$;

CREATE OR REPLACE FUNCTION public.analytics_telemetry_days(p_business_id uuid)
 RETURNS integer
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select case
    when not public.is_member_of_business(p_business_id) then 0
    else coalesce((
      select greatest(
        coalesce((
          select count(distinct u.day)
          from daily_screen_uptime u
          join screens s on s.id = u.screen_id
          join locations l on l.id = s.location_id
          where l.business_id = p_business_id and s.deleted_at is null
        ), 0),
        coalesce((
          select count(distinct pe.started_at::date)
          from playback_events pe
          join screens s on s.id = pe.screen_id
          join locations l on l.id = s.location_id
          where l.business_id = p_business_id and s.deleted_at is null
        ), 0)
      )::int
    ), 0)
  end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_business_stats()
 RETURNS TABLE(business_id uuid, business_name text, created_at timestamp with time zone, screens_total bigint, screens_online bigint, locations_total bigint, content_total bigint, members_total bigint, subscription_id uuid, plan text, billing_cycle text, status_stored text, status text, next_billing_date date, grace_period_ends_at timestamp with time zone, days_overdue integer, price_per_screen numeric, mrr numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH sub AS (
    SELECT DISTINCT ON (s.business_id) s.*
    FROM public.subscriptions s
    ORDER BY s.business_id, s.created_at DESC
  ),
  sc AS (
    SELECT l.business_id,
           count(*)::bigint AS total,
           count(*) FILTER (
             WHERE s.last_seen_at IS NOT NULL AND s.last_seen_at > now() - interval '3 minutes'
           )::bigint AS online
    FROM public.screens s
    JOIN public.locations l ON l.id = s.location_id
    WHERE s.deleted_at IS NULL
    GROUP BY l.business_id
  )
  SELECT b.id, b.name, b.created_at,
    COALESCE(sc.total, 0), COALESCE(sc.online, 0),
    (SELECT count(*) FROM public.locations l WHERE l.business_id = b.id),
    (SELECT count(*) FROM public.content c WHERE c.business_id = b.id),
    (SELECT count(*) FROM public.business_memberships m WHERE m.business_id = b.id),
    sub.id, sub.plan, sub.billing_cycle, sub.status,
    public.subscription_status_derived(sub.status, sub.next_billing_date, sub.grace_period_ends_at),
    sub.next_billing_date, sub.grace_period_ends_at,
    CASE WHEN sub.next_billing_date IS NULL OR sub.next_billing_date >= current_date
         THEN 0 ELSE (current_date - sub.next_billing_date) END,
    sub.price_per_screen,
    CASE
      WHEN sub.id IS NULL THEN 0
      WHEN public.subscription_status_derived(sub.status, sub.next_billing_date, sub.grace_period_ends_at)
           NOT IN ('active','grace','trialing') THEN 0
      ELSE COALESCE(sub.price_per_screen, 0) * COALESCE(sc.total, 0)
    END
  FROM public.businesses b
  LEFT JOIN sub ON sub.business_id = b.id
  LEFT JOIN sc ON sc.business_id = b.id
  WHERE public.is_platform_admin()
  ORDER BY b.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.analytics_orphan_content(p_business_id uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(content_id uuid, name text, thumbnail_url text, created_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select c.id, c.name, c.thumbnail_url, c.created_at
  from content c
  where c.business_id = p_business_id
    and public.is_member_of_business(p_business_id)
    and not exists (
      select 1 from playback_events pe
      join screens s on s.id = pe.screen_id
      where pe.content_id = c.id
        and s.deleted_at is null
        and pe.started_at >= p_from and pe.started_at < p_to
    )
  order by c.created_at asc;
$function$;

-- 10) Funciones de página / analíticas con filtro explícito
CREATE OR REPLACE FUNCTION public.analytics_overview(p_business_id uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(screens_total bigint, screens_online bigint, uptime_pct numeric, playbacks bigint, total_play_ms bigint)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  with biz_screens as (
    select s.id, s.status
    from screens s
    join locations l on l.id = s.location_id
    where l.business_id = p_business_id and s.deleted_at is null
  )
  select
    (select count(*) from biz_screens),
    (select count(*) from biz_screens where status = 'online'),
    coalesce((
      select round(avg(u.minutes_online::numeric / nullif(u.minutes_expected, 0) * 100), 1)
      from daily_screen_uptime u
      where u.screen_id in (select id from biz_screens)
        and u.day >= p_from::date and u.day < p_to::date
    ), 0),
    coalesce((
      select count(*) from playback_events pe
      where pe.screen_id in (select id from biz_screens)
        and pe.started_at >= p_from and pe.started_at < p_to
    ), 0),
    coalesce((
      select sum(pe.duration_ms)::bigint from playback_events pe
      where pe.screen_id in (select id from biz_screens)
        and pe.started_at >= p_from and pe.started_at < p_to
    ), 0);
$function$;

CREATE OR REPLACE FUNCTION public.analytics_screen_table(p_business_id uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(screen_id uuid, name text, location text, uptime_pct numeric, playbacks bigint, last_seen_at timestamp with time zone, status text)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  select s.id, s.name, coalesce(l.name, 'Sin sede'),
    coalesce(round(avg(u.minutes_online::numeric / nullif(u.minutes_expected, 0) * 100), 1), 0),
    coalesce(p.n, 0), s.last_seen_at, s.status
  from screens s
  join locations l on l.id = s.location_id
  left join daily_screen_uptime u
    on u.screen_id = s.id and u.day >= p_from::date and u.day < p_to::date
  left join lateral (
    select count(*) n from playback_events pe
    where pe.screen_id = s.id
      and pe.started_at >= p_from and pe.started_at < p_to
      and not pe.interrupted
  ) p on true
  where l.business_id = p_business_id and s.deleted_at is null
  group by s.id, s.name, l.name, s.last_seen_at, s.status, p.n
  order by 4 desc, s.name;
$function$;

CREATE OR REPLACE FUNCTION public.analytics_top_content(p_business_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_limit integer DEFAULT 10)
 RETURNS TABLE(content_id uuid, name text, thumbnail_url text, duration_seconds integer, playbacks bigint, total_ms bigint)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  select c.id, c.name, c.thumbnail_url, c.duration_seconds,
    count(*)::bigint, coalesce(sum(pe.duration_ms), 0)::bigint
  from playback_events pe
  join content c on c.id = pe.content_id
  join screens s on s.id = pe.screen_id
  join locations l on l.id = s.location_id
  where l.business_id = p_business_id
    and s.deleted_at is null
    and pe.started_at >= p_from and pe.started_at < p_to
  group by c.id, c.name, c.thumbnail_url, c.duration_seconds
  order by 5 desc
  limit coalesce(p_limit, 10);
$function$;

CREATE OR REPLACE FUNCTION public.get_screens_page()
 RETURNS jsonb LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  with biz as (select business_id from profiles where id = auth.uid())
  select jsonb_build_object(
    'screens', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from (
        select s.id, s.name, s.status, s.location_id, s.device_token,
               s.last_seen_at, s.created_at, s.rotation, s.device_type
        from screens s
        where s.deleted_at is null
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
               sub.expires_at, sub.grace_period_ends_at,
               sub.price_per_screen, sub.billing_cycle, sub.next_billing_date
        from subscriptions sub
        where sub.business_id = (select business_id from biz)
        limit 1
      ) t
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_dashboard_page()
 RETURNS jsonb LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
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
        where s.deleted_at is null
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
        where d.deleted_at is null
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
$function$;