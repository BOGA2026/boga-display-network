ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS ttclid text,
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS referrer text;

CREATE INDEX IF NOT EXISTS leads_utm_campaign_idx ON public.leads (utm_campaign);
CREATE INDEX IF NOT EXISTS leads_landing_path_idx ON public.leads (landing_path);