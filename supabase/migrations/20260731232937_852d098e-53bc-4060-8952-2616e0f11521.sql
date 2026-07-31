CREATE OR REPLACE FUNCTION public.complete_onboarding(p_business_name text, p_city text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing uuid;
  _biz uuid;
  _name text := nullif(btrim(p_business_name), '');
  _city text := nullif(btrim(p_city), '');
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _name IS NULL OR length(_name) > 120 THEN
    RAISE EXCEPTION 'invalid business name';
  END IF;
  IF _city IS NULL OR length(_city) > 120 THEN
    RAISE EXCEPTION 'invalid city';
  END IF;

  SELECT business_id INTO _existing FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _existing IS NULL THEN
    SELECT business_id INTO _existing FROM public.business_memberships WHERE user_id = _uid LIMIT 1;
  END IF;

  IF _existing IS NOT NULL THEN
    UPDATE public.profiles SET business_id = _existing, updated_at = now() WHERE id = _uid;
    RETURN jsonb_build_object('business_id', _existing, 'created', false);
  END IF;

  INSERT INTO public.businesses (name) VALUES (_name) RETURNING id INTO _biz;

  INSERT INTO public.business_memberships (user_id, business_id, role)
  VALUES (_uid, _biz, 'owner')
  ON CONFLICT (user_id, business_id) DO NOTHING;

  UPDATE public.profiles SET business_id = _biz, updated_at = now() WHERE id = _uid;

  INSERT INTO public.locations (name, address, business_id)
  VALUES ('Principal', _city, _biz);

  RETURN jsonb_build_object('business_id', _biz, 'created', true);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_onboarding(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text, text) TO authenticated;