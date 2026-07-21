
-- 1. Extend devices
ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS ip inet,
  ADD COLUMN IF NOT EXISTS network_type text,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS code_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS code_source text DEFAULT 'panel' CHECK (code_source IN ('tv','panel')),
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen_at ON public.devices(last_seen_at);

-- 2. pairing_attempts audit table
CREATE TABLE IF NOT EXISTS public.pairing_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip inet,
  device_code_attempted text,
  business_id_target uuid,
  success boolean NOT NULL DEFAULT false,
  reason text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.pairing_attempts TO service_role;
GRANT SELECT ON public.pairing_attempts TO authenticated;

ALTER TABLE public.pairing_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read pairing attempts"
ON public.pairing_attempts
FOR SELECT
TO authenticated
USING (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_pairing_attempts_ip_time
  ON public.pairing_attempts(ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pairing_attempts_code_time
  ON public.pairing_attempts(device_code_attempted, created_at DESC);

-- 3. Enable Realtime on devices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
  END IF;
END $$;

ALTER TABLE public.devices REPLICA IDENTITY FULL;
