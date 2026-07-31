CREATE OR REPLACE FUNCTION public.analytics_scan_days(p_business_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(DISTINCT (s.scanned_at AT TIME ZONE 'America/Bogota')::date), 0)::int
  FROM public.qr_scans s
  JOIN public.qr_codes q ON q.id = s.qr_code_id
  WHERE q.business_id = p_business_id
    AND public.is_member_of_business(p_business_id);
$$;

CREATE OR REPLACE FUNCTION public.analytics_scan_heatmap(
  p_business_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
RETURNS TABLE(dow smallint, hour smallint, scans bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXTRACT(DOW FROM (s.scanned_at AT TIME ZONE 'America/Bogota'))::smallint AS dow,
    EXTRACT(HOUR FROM (s.scanned_at AT TIME ZONE 'America/Bogota'))::smallint AS hour,
    COUNT(*)::bigint AS scans
  FROM public.qr_scans s
  JOIN public.qr_codes q ON q.id = s.qr_code_id
  WHERE q.business_id = p_business_id
    AND s.scanned_at >= p_from
    AND s.scanned_at < p_to
    AND public.is_member_of_business(p_business_id)
  GROUP BY 1, 2;
$$;

REVOKE ALL ON FUNCTION public.analytics_scan_days(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.analytics_scan_heatmap(uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_scan_days(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.analytics_scan_heatmap(uuid, timestamptz, timestamptz) TO authenticated, service_role;