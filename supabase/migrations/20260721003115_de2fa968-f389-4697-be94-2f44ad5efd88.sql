
-- QR codes and scans
CREATE TABLE public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  screen_id uuid REFERENCES public.screens(id) ON DELETE SET NULL,
  label text NOT NULL,
  target_url text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes TO authenticated;
GRANT ALL ON public.qr_codes TO service_role;

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view qr_codes of their business"
  ON public.qr_codes FOR SELECT TO authenticated
  USING (public.is_member_of_business(business_id));

CREATE POLICY "Managers can insert qr_codes"
  ON public.qr_codes FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_content_playlists(business_id) OR public.can_manage_business(business_id));

CREATE POLICY "Managers can update qr_codes"
  ON public.qr_codes FOR UPDATE TO authenticated
  USING (public.can_manage_content_playlists(business_id) OR public.can_manage_business(business_id))
  WITH CHECK (public.can_manage_content_playlists(business_id) OR public.can_manage_business(business_id));

CREATE POLICY "Managers can delete qr_codes"
  ON public.qr_codes FOR DELETE TO authenticated
  USING (public.can_manage_business(business_id));

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX qr_codes_business_id_idx ON public.qr_codes(business_id);
CREATE INDEX qr_codes_slug_idx ON public.qr_codes(slug);

-- Scans
CREATE TABLE public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  referrer text
);

GRANT SELECT ON public.qr_scans TO authenticated;
GRANT ALL ON public.qr_scans TO service_role;

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view scans of their business qr_codes"
  ON public.qr_scans FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.qr_codes qc
    WHERE qc.id = qr_scans.qr_code_id
      AND public.is_member_of_business(qc.business_id)
  ));

CREATE INDEX qr_scans_qr_code_id_scanned_at_idx ON public.qr_scans(qr_code_id, scanned_at DESC);
