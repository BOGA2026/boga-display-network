
-- Per-business monthly AI generation limit
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS ai_monthly_limit integer NOT NULL DEFAULT 100 CHECK (ai_monthly_limit >= 0);

-- Brand kit (colors, logo, watermark preference) per business
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  primary_color text NOT NULL DEFAULT '#5227FF',
  secondary_color text NOT NULL DEFAULT '#B794F6',
  accent_color text,
  logo_url text,
  watermark_disabled boolean NOT NULL DEFAULT false,
  font_family text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_kits TO authenticated;
GRANT ALL ON public.brand_kits TO service_role;

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read brand kit"
  ON public.brand_kits FOR SELECT
  USING (public.is_member_of_business(business_id));

CREATE POLICY "Admins upsert brand kit"
  ON public.brand_kits FOR INSERT
  WITH CHECK (public.can_manage_business(business_id));

CREATE POLICY "Admins update brand kit"
  ON public.brand_kits FOR UPDATE
  USING (public.can_manage_business(business_id));

CREATE POLICY "Admins delete brand kit"
  ON public.brand_kits FOR DELETE
  USING (public.can_manage_business(business_id));

CREATE TRIGGER trg_brand_kits_updated
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI generation log (one row per tool invocation)
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tool text NOT NULL CHECK (tool IN ('generate_image','generate_video_loop','suggest_copy','apply_brand_kit')),
  prompt text,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_url text,
  output_text text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled','failed')),
  tokens_used integer NOT NULL DEFAULT 0,
  cost_cents integer NOT NULL DEFAULT 0,
  error text,
  source text NOT NULL DEFAULT 'dashboard' CHECK (source IN ('dashboard','mcp')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read generations"
  ON public.ai_generations FOR SELECT
  USING (public.is_member_of_business(business_id));

CREATE POLICY "Editors insert generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (public.can_manage_content_playlists(business_id) OR public.can_manage_business(business_id));

CREATE POLICY "Editors update own generations"
  ON public.ai_generations FOR UPDATE
  USING (public.is_member_of_business(business_id));

CREATE POLICY "Admins delete generations"
  ON public.ai_generations FOR DELETE
  USING (public.can_manage_business(business_id));

CREATE INDEX IF NOT EXISTS ai_generations_business_month_idx
  ON public.ai_generations (business_id, created_at DESC);

CREATE TRIGGER trg_ai_generations_updated
  BEFORE UPDATE ON public.ai_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
