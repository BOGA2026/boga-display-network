-- 1. Kill automatic privilege escalation on email confirmation
DROP TRIGGER IF EXISTS on_auth_user_admin_grant ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_platform_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_grant_platform_admin ON auth.users;
DROP FUNCTION IF EXISTS public.grant_platform_admin_if_allowed() CASCADE;

-- 2. Invitation lifecycle
ALTER TABLE public.platform_admin_allowlist
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.platform_admin_allowlist a
SET status = 'activated',
    activated_at = COALESCE(a.activated_at, pa.granted_at)
FROM auth.users u
JOIN public.platform_admins pa ON pa.user_id = u.id
WHERE lower(u.email) = lower(a.email);

-- 3. Audit log
CREATE TABLE IF NOT EXISTS public.platform_admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  target_email text NOT NULL,
  target_user_id uuid,
  ip inet,
  user_agent text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_admin_audit TO authenticated;
GRANT ALL ON public.platform_admin_audit TO service_role;

ALTER TABLE public.platform_admin_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can read admin audit" ON public.platform_admin_audit;
CREATE POLICY "Platform admins can read admin audit"
  ON public.platform_admin_audit FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_platform_admin_audit_created_at
  ON public.platform_admin_audit (created_at DESC);

-- 4. Managed operations (allowlist is no longer writable directly from the client)
REVOKE INSERT, UPDATE, DELETE ON public.platform_admin_allowlist FROM authenticated;

DROP POLICY IF EXISTS "Platform admins manage allowlist" ON public.platform_admin_allowlist;
CREATE POLICY "Platform admins read allowlist"
  ON public.platform_admin_allowlist FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.log_platform_admin_event(
  _action text, _target_email text, _target_user_id uuid,
  _ip text, _user_agent text, _details jsonb
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  INSERT INTO public.platform_admin_audit (action, actor_id, actor_email, target_email, target_user_id, ip, user_agent, details)
  VALUES (
    _action,
    auth.uid(),
    (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()),
    lower(_target_email),
    _target_user_id,
    NULLIF(_ip, '')::inet,
    _user_agent,
    COALESCE(_details, '{}'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.invite_platform_admin(_email text, _ip text DEFAULT NULL, _user_agent text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _e text := lower(btrim(_email));
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF _e IS NULL OR _e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'correo inválido'; END IF;

  INSERT INTO public.platform_admin_allowlist (email, status, invited_by, invited_at, expires_at)
  VALUES (_e, 'pending', auth.uid(), now(), now() + interval '7 days')
  ON CONFLICT (email) DO UPDATE
    SET status = CASE WHEN public.platform_admin_allowlist.status = 'activated' THEN 'activated' ELSE 'pending' END,
        invited_by = auth.uid(),
        invited_at = now(),
        expires_at = now() + interval '7 days';

  PERFORM public.log_platform_admin_event('invite', _e, NULL, _ip, _user_agent, jsonb_build_object('expires_in_days', 7));
  RETURN jsonb_build_object('ok', true, 'email', _e);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_platform_admin_invite(_email text, _ip text DEFAULT NULL, _user_agent text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _e text := lower(btrim(_email));
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'not allowed'; END IF;
  DELETE FROM public.platform_admin_allowlist WHERE lower(email) = _e AND status <> 'activated';
  IF NOT FOUND THEN RAISE EXCEPTION 'no hay invitación pendiente para ese correo'; END IF;
  PERFORM public.log_platform_admin_event('invite_cancelled', _e, NULL, _ip, _user_agent, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_platform_admin(_email text, _ip text DEFAULT NULL, _user_agent text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _e text := lower(btrim(_email)); _inv record; _uid uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'not allowed'; END IF;

  SELECT * INTO _inv FROM public.platform_admin_allowlist WHERE lower(email) = _e FOR UPDATE;
  IF _inv IS NULL THEN RAISE EXCEPTION 'ese correo no tiene invitación'; END IF;
  IF _inv.status = 'activated' THEN RAISE EXCEPTION 'ese correo ya está activo'; END IF;
  IF _inv.expires_at < now() THEN RAISE EXCEPTION 'la invitación caducó, envíala de nuevo'; END IF;

  SELECT u.id INTO _uid FROM auth.users u
   WHERE lower(u.email) = _e AND u.email_confirmed_at IS NOT NULL LIMIT 1;
  IF _uid IS NULL THEN RAISE EXCEPTION 'la persona aún no ha creado su cuenta ni confirmado el correo'; END IF;

  INSERT INTO public.platform_admins (user_id, granted_by)
  VALUES (_uid, auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.platform_admin_allowlist
     SET status = 'activated', activated_at = now(), activated_by = auth.uid()
   WHERE lower(email) = _e;

  PERFORM public.log_platform_admin_event('activated', _e, _uid, _ip, _user_agent, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true, 'user_id', _uid, 'email', _e);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_platform_admin(_email text, _ip text DEFAULT NULL, _user_agent text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _e text := lower(btrim(_email)); _uid uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'not allowed'; END IF;

  SELECT u.id INTO _uid FROM auth.users u WHERE lower(u.email) = _e LIMIT 1;
  IF _uid IS NULL THEN RAISE EXCEPTION 'usuario no encontrado'; END IF;
  IF _uid = auth.uid() THEN RAISE EXCEPTION 'no puedes revocarte a ti mismo'; END IF;
  IF (SELECT count(*) FROM public.platform_admins) <= 1 THEN RAISE EXCEPTION 'debe quedar al menos un administrador'; END IF;

  DELETE FROM public.platform_admins WHERE user_id = _uid;
  DELETE FROM public.platform_admin_allowlist WHERE lower(email) = _e;

  PERFORM public.log_platform_admin_event('revoked', _e, _uid, _ip, _user_agent, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_platform_admin_access()
RETURNS TABLE(email text, status text, invited_at timestamptz, expires_at timestamptz,
              activated_at timestamptz, has_account boolean, email_confirmed boolean, is_expired boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.email,
         CASE WHEN a.status = 'pending' AND a.expires_at < now() THEN 'expired' ELSE a.status END,
         a.invited_at, a.expires_at, a.activated_at,
         EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(a.email)),
         EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(a.email) AND u.email_confirmed_at IS NOT NULL),
         (a.status = 'pending' AND a.expires_at < now())
  FROM public.platform_admin_allowlist a
  WHERE public.is_platform_admin()
  ORDER BY a.status, a.email;
$$;

REVOKE EXECUTE ON FUNCTION public.invite_platform_admin(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_platform_admin_invite(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.activate_platform_admin(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_platform_admin(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_platform_admin_access() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_platform_admin_event(text, text, uuid, text, text, jsonb) FROM anon, authenticated;