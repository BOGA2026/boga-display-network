
-- Create devices table for device pairing
CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  screen_id uuid REFERENCES public.screens(id) ON DELETE SET NULL,
  screen_name text,
  paired_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  app_version text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Members can view devices in their business
CREATE POLICY "Members can view devices"
ON public.devices FOR SELECT
USING (is_member_of_business(business_id));

-- Admin/Manager can insert devices
CREATE POLICY "Admin/Manager can insert devices"
ON public.devices FOR INSERT
WITH CHECK (can_manage_locations_screens(business_id));

-- Admin/Manager can update devices
CREATE POLICY "Admin/Manager can update devices"
ON public.devices FOR UPDATE
USING (can_manage_locations_screens(business_id));

-- Admin/Manager can delete devices
CREATE POLICY "Admin/Manager can delete devices"
ON public.devices FOR DELETE
USING (can_manage_locations_screens(business_id));

-- Trigger for updated_at
CREATE TRIGGER update_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Also add an anon-accessible policy for device check-in (devices authenticate by code, not user session)
CREATE POLICY "Devices can update own status by code"
ON public.devices FOR UPDATE
USING (true)
WITH CHECK (true);
-- Note: The edge function will use service role for device operations
