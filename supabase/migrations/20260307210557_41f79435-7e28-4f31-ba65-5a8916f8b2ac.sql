ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS inquiry text,
  ADD COLUMN IF NOT EXISTS preferred_time text;