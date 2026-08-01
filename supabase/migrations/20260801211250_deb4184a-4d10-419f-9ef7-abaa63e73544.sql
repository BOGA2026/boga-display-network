CREATE OR REPLACE FUNCTION public.sweep_offline_devices(_threshold_seconds integer DEFAULT 180)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected integer;
BEGIN
  UPDATE public.devices
  SET status = 'offline', updated_at = now()
  WHERE status <> 'offline'
    AND paired_at IS NOT NULL
    AND (last_seen_at IS NULL OR last_seen_at < now() - make_interval(secs => _threshold_seconds));
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$;

COMMENT ON FUNCTION public.sweep_offline_devices(integer) IS
'Umbral en segundos. Fuente de verdad: supabase/functions/_shared/offlineThreshold.ts (OFFLINE_THRESHOLD_SECONDS). Si cambia alla, cambiar aca. El default (180) es red de seguridad: los llamadores deben pasar el valor explicito.';