DROP POLICY IF EXISTS "anyone can log a brand check" ON public.landing_brand_checks;

CREATE POLICY "anyone can log a valid brand check"
ON public.landing_brand_checks
FOR INSERT
TO anon, authenticated
WITH CHECK (
  brand_id ~ '^[a-z0-9_-]{1,40}$'
  AND verdict IN ('ok', 'needs_device', 'unsupported', 'unknown')
  AND (visitor_id IS NULL OR visitor_id ~ '^[A-Za-z0-9_-]{1,64}$')
  AND (path IS NULL OR (length(path) <= 200 AND path ~ '^/'))
);