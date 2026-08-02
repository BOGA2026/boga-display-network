ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS tv_brand text,
  ADD COLUMN IF NOT EXISTS needs_device boolean;