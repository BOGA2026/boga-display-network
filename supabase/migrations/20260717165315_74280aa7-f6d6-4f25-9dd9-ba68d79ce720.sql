
-- ============ PQRS ============
CREATE TABLE public.pqrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('peticion','queja','reclamo','sugerencia')),
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo','en_proceso','resuelto','cerrado')),
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baja','media','alta','critica')),
  read_by_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pqrs TO authenticated;
GRANT ALL ON public.pqrs TO service_role;
ALTER TABLE public.pqrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own pqrs" ON public.pqrs FOR SELECT
  USING (public.is_member_of_business(business_id));
CREATE POLICY "Members insert own pqrs" ON public.pqrs FOR INSERT
  WITH CHECK (public.is_member_of_business(business_id) AND created_by = auth.uid());
CREATE POLICY "Platform admins view all pqrs" ON public.pqrs FOR SELECT
  USING (public.is_platform_admin());
CREATE POLICY "Platform admins update pqrs" ON public.pqrs FOR UPDATE
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE TRIGGER trg_pqrs_updated_at BEFORE UPDATE ON public.pqrs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pqrs_business ON public.pqrs(business_id);
CREATE INDEX idx_pqrs_status ON public.pqrs(status);

-- ============ PQRS responses ============
CREATE TABLE public.pqrs_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pqrs_id uuid NOT NULL REFERENCES public.pqrs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('admin','user')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pqrs_responses TO authenticated;
GRANT ALL ON public.pqrs_responses TO service_role;
ALTER TABLE public.pqrs_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view responses of own pqrs" ON public.pqrs_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pqrs p WHERE p.id = pqrs_id AND public.is_member_of_business(p.business_id)));
CREATE POLICY "Platform admins view all responses" ON public.pqrs_responses FOR SELECT
  USING (public.is_platform_admin());
CREATE POLICY "Users respond own pqrs" ON public.pqrs_responses FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (author_role = 'admin' AND public.is_platform_admin())
      OR (author_role = 'user' AND EXISTS (SELECT 1 FROM public.pqrs p WHERE p.id = pqrs_id AND public.is_member_of_business(p.business_id)))
    )
  );

CREATE INDEX idx_pqrs_responses_pqrs ON public.pqrs_responses(pqrs_id);

-- ============ Support threads (one per business) ============
CREATE TABLE public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  unread_by_admin int NOT NULL DEFAULT 0,
  unread_by_user int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.support_threads TO authenticated;
GRANT ALL ON public.support_threads TO service_role;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own thread" ON public.support_threads FOR SELECT
  USING (public.is_member_of_business(business_id));
CREATE POLICY "Members create own thread" ON public.support_threads FOR INSERT
  WITH CHECK (public.is_member_of_business(business_id));
CREATE POLICY "Members update own thread" ON public.support_threads FOR UPDATE
  USING (public.is_member_of_business(business_id)) WITH CHECK (public.is_member_of_business(business_id));
CREATE POLICY "Platform admins view all threads" ON public.support_threads FOR SELECT
  USING (public.is_platform_admin());
CREATE POLICY "Platform admins update all threads" ON public.support_threads FOR UPDATE
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE TRIGGER trg_support_threads_updated_at BEFORE UPDATE ON public.support_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Support messages ============
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('admin','user')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own thread messages" ON public.support_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND public.is_member_of_business(t.business_id)));
CREATE POLICY "Platform admins view all messages" ON public.support_messages FOR SELECT
  USING (public.is_platform_admin());
CREATE POLICY "Users send messages in own thread" ON public.support_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (author_role = 'admin' AND public.is_platform_admin())
      OR (author_role = 'user' AND EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND public.is_member_of_business(t.business_id)))
    )
  );

CREATE INDEX idx_support_messages_thread ON public.support_messages(thread_id, created_at);

-- Trigger to bump thread counters when a message is inserted
CREATE OR REPLACE FUNCTION public.support_bump_thread()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.support_threads
     SET last_message_at = NEW.created_at,
         unread_by_admin = CASE WHEN NEW.author_role = 'user' THEN unread_by_admin + 1 ELSE unread_by_admin END,
         unread_by_user  = CASE WHEN NEW.author_role = 'admin' THEN unread_by_user + 1 ELSE unread_by_user END,
         updated_at = now()
   WHERE id = NEW.thread_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_support_bump_thread AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.support_bump_thread();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pqrs_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pqrs;
