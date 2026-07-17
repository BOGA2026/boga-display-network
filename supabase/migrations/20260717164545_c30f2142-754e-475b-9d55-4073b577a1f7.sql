
-- user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_ping_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Platform admins view all sessions" ON public.user_sessions
  FOR SELECT USING (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_ping ON public.user_sessions(last_ping_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON public.user_sessions(started_at DESC);

-- Platform admin read access for missing tables
CREATE POLICY "Platform admins view all subscriptions" ON public.subscriptions
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all invoices" ON public.invoices
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all profiles" ON public.profiles
  FOR SELECT USING (public.is_platform_admin());

-- Enable realtime for screens (idempotent)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.screens;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
