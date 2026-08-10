CREATE OR REPLACE FUNCTION public.guard_screen_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     AND coalesce(current_setting('app.allow_screen_soft_delete', true), '') <> 'on' THEN
    RAISE EXCEPTION 'usa las funciones de eliminar o restaurar pantallas';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.soft_delete_screens(p_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _biz uuid; _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN RAISE EXCEPTION 'sin pantallas'; END IF;

  SELECT DISTINCT l.business_id INTO _biz
  FROM public.screens s JOIN public.locations l ON l.id = s.location_id
  WHERE s.id = ANY(p_ids) AND s.deleted_at IS NULL
  LIMIT 2;

  IF _biz IS NULL THEN RAISE EXCEPTION 'pantallas no encontradas'; END IF;
  IF NOT public.can_manage_business(_biz) THEN RAISE EXCEPTION 'solo el dueño o un administrador puede eliminar pantallas'; END IF;

  PERFORM set_config('app.allow_screen_soft_delete', 'on', true);

  UPDATE public.screens s
     SET deleted_at = now(), deleted_by = auth.uid(), status = 'offline', updated_at = now()
   WHERE s.id = ANY(p_ids)
     AND s.deleted_at IS NULL
     AND EXISTS (SELECT 1 FROM public.locations l WHERE l.id = s.location_id AND l.business_id = _biz);
  GET DIAGNOSTICS _count = ROW_COUNT;

  UPDATE public.devices d
     SET deleted_at = now(), deleted_by = auth.uid(), status = 'unlinked', updated_at = now()
   WHERE d.screen_id = ANY(p_ids) AND d.business_id = _biz AND d.deleted_at IS NULL;

  UPDATE public.schedules SET is_active = false WHERE screen_id = ANY(p_ids) AND is_active;
  UPDATE public.schedule_blocks SET is_enabled = false WHERE screen_id = ANY(p_ids) AND is_enabled;

  PERFORM set_config('app.allow_screen_soft_delete', 'off', true);

  PERFORM public.sync_subscription_screens_count(_biz);
  PERFORM public.log_audit(_biz, 'screens.deleted', 'screen', NULL,
    jsonb_build_object('ids', to_jsonb(p_ids), 'count', _count));

  RETURN jsonb_build_object('deleted', _count, 'business_id', _biz,
    'screens_count', (SELECT screens_count FROM public.subscriptions WHERE business_id = _biz LIMIT 1));
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_screens(p_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _biz uuid; _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT DISTINCT l.business_id INTO _biz
  FROM public.screens s JOIN public.locations l ON l.id = s.location_id
  WHERE s.id = ANY(p_ids) AND s.deleted_at IS NOT NULL
  LIMIT 2;

  IF _biz IS NULL THEN RAISE EXCEPTION 'pantallas no encontradas'; END IF;
  IF NOT public.can_manage_business(_biz) THEN RAISE EXCEPTION 'solo el dueño o un administrador puede restaurar pantallas'; END IF;

  PERFORM set_config('app.allow_screen_soft_delete', 'on', true);

  UPDATE public.screens s
     SET deleted_at = NULL, deleted_by = NULL, updated_at = now()
   WHERE s.id = ANY(p_ids)
     AND s.deleted_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.locations l WHERE l.id = s.location_id AND l.business_id = _biz);
  GET DIAGNOSTICS _count = ROW_COUNT;

  UPDATE public.devices d
     SET deleted_at = NULL, deleted_by = NULL, updated_at = now()
   WHERE d.screen_id = ANY(p_ids) AND d.business_id = _biz AND d.deleted_at IS NOT NULL;

  PERFORM set_config('app.allow_screen_soft_delete', 'off', true);

  PERFORM public.sync_subscription_screens_count(_biz);
  PERFORM public.log_audit(_biz, 'screens.restored', 'screen', NULL,
    jsonb_build_object('ids', to_jsonb(p_ids), 'count', _count));

  RETURN jsonb_build_object('restored', _count);
END;
$function$;