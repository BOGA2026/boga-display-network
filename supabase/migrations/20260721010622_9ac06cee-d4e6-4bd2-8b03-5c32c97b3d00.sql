
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.qr_scans ADD COLUMN IF NOT EXISTS device_type text;
ALTER TABLE public.qr_scans ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.qr_scans ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.qr_scans ADD COLUMN IF NOT EXISTS screen_id uuid REFERENCES public.screens(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS qr_scans_qr_code_id_scanned_at_idx ON public.qr_scans(qr_code_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS qr_codes_slug_idx ON public.qr_codes(slug);

-- Enable realtime so the dashboard updates scan counts live without reload.
ALTER TABLE public.qr_scans REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='qr_scans') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_scans;
  END IF;
END $$;
