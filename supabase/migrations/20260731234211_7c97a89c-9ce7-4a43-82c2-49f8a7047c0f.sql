ALTER TABLE public.content ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS thumbnail_status text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'content_thumbnail_status_check'
  ) THEN
    ALTER TABLE public.content
      ADD CONSTRAINT content_thumbnail_status_check
      CHECK (thumbnail_status IS NULL OR thumbnail_status IN ('pendiente','listo','error'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_content_thumbnail_pending
  ON public.content (business_id)
  WHERE thumbnail_url IS NULL;