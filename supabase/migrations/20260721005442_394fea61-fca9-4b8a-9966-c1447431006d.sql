
-- Add per-item playback duration (seconds) to playlist items.
ALTER TABLE public.playlist_items
  ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 10 CHECK (duration_seconds BETWEEN 1 AND 3600);

-- Track publish confirmations per target screen for a schedule save.
CREATE TABLE IF NOT EXISTS public.schedule_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  screen_id uuid NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  schedule_version integer NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','received','playing','failed')),
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz,
  playing_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_publications TO authenticated;
GRANT ALL ON public.schedule_publications TO service_role;

ALTER TABLE public.schedule_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read publications"
  ON public.schedule_publications FOR SELECT
  USING (public.is_member_of_business(business_id));

CREATE POLICY "Managers insert publications"
  ON public.schedule_publications FOR INSERT
  WITH CHECK (public.can_manage_locations_screens(business_id));

CREATE POLICY "Managers update publications"
  ON public.schedule_publications FOR UPDATE
  USING (public.can_manage_locations_screens(business_id));

CREATE POLICY "Managers delete publications"
  ON public.schedule_publications FOR DELETE
  USING (public.can_manage_locations_screens(business_id));

CREATE INDEX IF NOT EXISTS schedule_publications_screen_idx
  ON public.schedule_publications (screen_id, sent_at DESC);

CREATE TRIGGER trg_schedule_publications_updated
  BEFORE UPDATE ON public.schedule_publications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime: emit UPDATEs so the panel sees status transitions.
ALTER TABLE public.schedule_publications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_publications;
