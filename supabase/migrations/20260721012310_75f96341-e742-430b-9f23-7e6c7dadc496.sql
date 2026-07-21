
-- 1. Extend role enum with owner and viewer
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

COMMIT;
BEGIN;

-- 2. Update helper functions so 'owner' inherits admin capabilities
CREATE OR REPLACE FUNCTION public.can_manage_business(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid()
      AND business_id = _business_id
      AND role IN ('owner','admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_locations_screens(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid()
      AND business_id = _business_id
      AND role IN ('owner','admin','manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_content_playlists(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid()
      AND business_id = _business_id
      AND role IN ('owner','admin','content_editor')
  )
$$;

-- 3. Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_business_created_idx
  ON public.audit_log (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx
  ON public.audit_log (actor_id, created_at DESC);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can insert audit for their business" ON public.audit_log;
CREATE POLICY "Members can insert audit for their business"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (business_id IS NULL OR public.is_member_of_business(business_id))
  );

DROP POLICY IF EXISTS "Admins read business audit" ON public.audit_log;
CREATE POLICY "Admins read business audit"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR (business_id IS NOT NULL AND public.can_manage_business(business_id))
    OR actor_id = auth.uid()
  );

-- 4. Convenience RPC to write audit entries from the client
CREATE OR REPLACE FUNCTION public.log_audit(
  _business_id uuid,
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _business_id IS NOT NULL AND NOT public.is_member_of_business(_business_id) THEN
    RAISE EXCEPTION 'not a member of business';
  END IF;
  INSERT INTO public.audit_log (business_id, actor_id, action, entity_type, entity_id, details)
  VALUES (_business_id, auth.uid(), _action, _entity_type, _entity_id, COALESCE(_details,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) TO authenticated;

-- 5. Promote existing sole admin memberships to owner
UPDATE public.business_memberships bm
SET role = 'owner'
WHERE role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.business_memberships bm2
    WHERE bm2.business_id = bm.business_id AND bm2.role = 'owner'
  )
  AND bm.created_at = (
    SELECT MIN(created_at) FROM public.business_memberships
    WHERE business_id = bm.business_id
  );

COMMIT;
