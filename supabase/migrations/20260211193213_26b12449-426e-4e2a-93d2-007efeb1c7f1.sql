
-- Remove overly permissive device update policy; edge function uses service role instead
DROP POLICY "Devices can update own status by code" ON public.devices;
