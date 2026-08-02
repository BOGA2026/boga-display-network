ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_text text,
  ADD COLUMN IF NOT EXISTS consent_version text;

COMMENT ON COLUMN public.leads.consent_at IS 'Momento exacto en que la persona marco la casilla de autorizacion (Ley 1581).';
COMMENT ON COLUMN public.leads.consent_text IS 'Texto literal de la autorizacion que la persona acepto.';