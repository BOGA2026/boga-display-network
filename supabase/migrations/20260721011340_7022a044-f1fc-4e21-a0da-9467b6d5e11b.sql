
-- 1. Add address column to devices
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS address text;

-- 2. Offline events table
CREATE TABLE IF NOT EXISTS public.device_offline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  went_offline_at timestamptz NOT NULL DEFAULT now(),
  came_online_at timestamptz,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_offline_events_device ON public.device_offline_events(device_id, went_offline_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_offline_events_business ON public.device_offline_events(business_id, went_offline_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_offline_events_open ON public.device_offline_events(device_id) WHERE came_online_at IS NULL;

GRANT SELECT ON public.device_offline_events TO authenticated;
GRANT ALL ON public.device_offline_events TO service_role;

ALTER TABLE public.device_offline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view offline events of their business"
  ON public.device_offline_events
  FOR SELECT
  TO authenticated
  USING (public.is_member_of_business(business_id) OR public.is_platform_admin());

-- 3. Trigger to log offline transitions
CREATE OR REPLACE FUNCTION public.log_device_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'offline' AND OLD.status <> 'offline' THEN
      -- Open a new event (only if none is already open for this device)
      INSERT INTO public.device_offline_events (device_id, business_id, went_offline_at)
      SELECT NEW.id, NEW.business_id, now()
      WHERE NOT EXISTS (
        SELECT 1 FROM public.device_offline_events
        WHERE device_id = NEW.id AND came_online_at IS NULL
      );
    ELSIF OLD.status = 'offline' AND NEW.status <> 'offline' THEN
      -- Close the most recent open event
      UPDATE public.device_offline_events
      SET came_online_at = now(),
          duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (now() - went_offline_at))::integer)
      WHERE device_id = NEW.id AND came_online_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_device_status_transition ON public.devices;
CREATE TRIGGER trg_log_device_status_transition
  AFTER UPDATE OF status ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.log_device_status_transition();

-- 4. Sweep function: flip stale devices to offline
CREATE OR REPLACE FUNCTION public.sweep_offline_devices(_threshold_seconds integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.sweep_offline_devices(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.sweep_offline_devices(integer) TO service_role;

-- 5. Realtime for devices and offline events
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.device_offline_events REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.devices';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.device_offline_events';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
