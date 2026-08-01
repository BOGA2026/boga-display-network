CREATE TABLE public.landing_brand_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('probable','necesita_dispositivo','desconocido')),
  visitor_id text,
  path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.landing_brand_checks TO anon;
GRANT INSERT, SELECT ON public.landing_brand_checks TO authenticated;
GRANT ALL ON public.landing_brand_checks TO service_role;

ALTER TABLE public.landing_brand_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can log a brand check"
  ON public.landing_brand_checks FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "platform admins read brand checks"
  ON public.landing_brand_checks FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE INDEX idx_landing_brand_checks_created ON public.landing_brand_checks (created_at DESC);