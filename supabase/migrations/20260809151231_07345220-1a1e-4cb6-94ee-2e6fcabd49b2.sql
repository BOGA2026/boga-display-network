CREATE TABLE public.exit_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL UNIQUE,
  code text NOT NULL,
  percent integer NOT NULL,
  status text NOT NULL DEFAULT 'shown',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  resolved_at timestamptz
);

GRANT ALL ON public.exit_offers TO service_role;
ALTER TABLE public.exit_offers ENABLE ROW LEVEL SECURITY;
-- Sin políticas: el acceso pasa exclusivamente por las funciones de abajo.

CREATE OR REPLACE FUNCTION public.exit_offer_payload(_row public.exit_offers)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE WHEN _row.id IS NULL THEN NULL ELSE jsonb_build_object(
    'code', _row.code,
    'percent', _row.percent,
    'status', _row.status,
    'expires_at', _row.expires_at,
    'server_now', now(),
    'active', (_row.status = 'shown' AND _row.expires_at > now())
  ) END;
$$;

CREATE OR REPLACE FUNCTION public.exit_offer_claim(p_visitor_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _v text := nullif(btrim(p_visitor_id), ''); _row public.exit_offers;
BEGIN
  IF _v IS NULL OR length(_v) > 64 THEN RAISE EXCEPTION 'invalid visitor'; END IF;

  INSERT INTO public.exit_offers (visitor_id, code, percent, expires_at)
  VALUES (_v, 'ANUAL20', 20, now() + interval '5 minutes')
  ON CONFLICT (visitor_id) DO NOTHING;

  SELECT * INTO _row FROM public.exit_offers WHERE visitor_id = _v;
  RETURN public.exit_offer_payload(_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.exit_offer_get(p_visitor_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _v text := nullif(btrim(p_visitor_id), ''); _row public.exit_offers;
BEGIN
  IF _v IS NULL OR length(_v) > 64 THEN RETURN NULL; END IF;
  SELECT * INTO _row FROM public.exit_offers WHERE visitor_id = _v;
  RETURN public.exit_offer_payload(_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.exit_offer_mark(p_visitor_id text, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _v text := nullif(btrim(p_visitor_id), ''); _row public.exit_offers;
BEGIN
  IF _v IS NULL OR length(_v) > 64 THEN RAISE EXCEPTION 'invalid visitor'; END IF;
  IF p_status NOT IN ('accepted','dismissed') THEN RAISE EXCEPTION 'invalid status'; END IF;

  UPDATE public.exit_offers
     SET status = p_status, resolved_at = now()
   WHERE visitor_id = _v AND status = 'shown'
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    SELECT * INTO _row FROM public.exit_offers WHERE visitor_id = _v;
  END IF;
  RETURN public.exit_offer_payload(_row);
END;
$$;

REVOKE ALL ON FUNCTION public.exit_offer_payload(public.exit_offers) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exit_offer_claim(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exit_offer_get(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exit_offer_mark(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.exit_offer_claim(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.exit_offer_get(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.exit_offer_mark(text, text) TO anon, authenticated, service_role;