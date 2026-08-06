
-- 1) Regla explícita de estado
CREATE OR REPLACE FUNCTION public.subscription_status_derived(
  _status text,
  _next_billing_date date,
  _grace_period_ends_at timestamptz
) RETURNS text
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _status IN ('canceled','cancelled') THEN 'canceled'
    WHEN _status = 'paused' THEN 'paused'
    WHEN _status IN ('trial','trialing')
         AND (_next_billing_date IS NULL OR _next_billing_date >= current_date) THEN 'trialing'
    WHEN _next_billing_date IS NULL THEN 'active'
    WHEN _next_billing_date >= current_date THEN 'active'
    WHEN _grace_period_ends_at IS NOT NULL AND _grace_period_ends_at > now() THEN 'grace'
    ELSE 'past_due'
  END;
$$;

-- 2) Fuente única de números por negocio
CREATE OR REPLACE FUNCTION public.admin_business_stats()
RETURNS TABLE(
  business_id uuid,
  business_name text,
  created_at timestamptz,
  screens_total bigint,
  screens_online bigint,
  locations_total bigint,
  content_total bigint,
  members_total bigint,
  subscription_id uuid,
  plan text,
  billing_cycle text,
  status_stored text,
  status text,
  next_billing_date date,
  grace_period_ends_at timestamptz,
  days_overdue integer,
  price_per_screen numeric,
  mrr numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    GROUP BY l.business_id
  )
  SELECT
    b.id,
    b.name,
    b.created_at,
    COALESCE(sc.total, 0),
    COALESCE(sc.online, 0),
    (SELECT count(*) FROM public.locations l WHERE l.business_id = b.id),
    (SELECT count(*) FROM public.content c WHERE c.business_id = b.id),
    (SELECT count(*) FROM public.business_memberships m WHERE m.business_id = b.id),
    sub.id,
    sub.plan,
    sub.billing_cycle,
    sub.status,
    public.subscription_status_derived(sub.status, sub.next_billing_date, sub.grace_period_ends_at),
    sub.next_billing_date,
    sub.grace_period_ends_at,
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
$$;

REVOKE ALL ON FUNCTION public.admin_business_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_business_stats() TO authenticated;
REVOKE ALL ON FUNCTION public.subscription_status_derived(text, date, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.subscription_status_derived(text, date, timestamptz) TO authenticated, service_role;

-- 3) Job diario de recálculo
CREATE OR REPLACE FUNCTION public.recalc_subscription_statuses()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.subscriptions s
     SET status = public.subscription_status_derived(s.status, s.next_billing_date, s.grace_period_ends_at),
         updated_at = now()
   WHERE s.status NOT IN ('canceled','cancelled','paused')
     AND s.status IS DISTINCT FROM
         public.subscription_status_derived(s.status, s.next_billing_date, s.grace_period_ends_at);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.recalc_subscription_statuses() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_subscription_statuses() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule('recalc-subscription-statuses')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'recalc-subscription-statuses');
SELECT cron.schedule('recalc-subscription-statuses', '0 6 * * *',
  $cron$ SELECT public.recalc_subscription_statuses(); $cron$);
