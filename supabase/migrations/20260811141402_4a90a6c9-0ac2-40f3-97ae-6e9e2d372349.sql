CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_type text NOT NULL,
  piece_type text NOT NULL,
  orientation text NOT NULL CHECK (orientation IN ('vertical','horizontal')),
  background_url text NOT NULL,
  thumbnail_url text NOT NULL,
  document jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active templates"
  ON public.templates FOR SELECT TO authenticated
  USING (is_active OR public.is_platform_admin());

CREATE POLICY "Platform admins manage templates"
  ON public.templates FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

GRANT INSERT, UPDATE, DELETE ON public.templates TO authenticated;

CREATE INDEX idx_templates_filters ON public.templates (orientation, business_type, piece_type) WHERE is_active;

CREATE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();