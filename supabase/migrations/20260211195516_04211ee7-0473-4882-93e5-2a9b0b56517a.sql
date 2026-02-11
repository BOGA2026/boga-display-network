-- Fix profiles table RLS - require authentication for all SELECT
DROP POLICY IF EXISTS "Users can view business members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "Users can view business members"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND business_id IS NOT NULL AND business_id = get_user_business_id());

-- Fix devices table RLS - require authentication for all SELECT
DROP POLICY IF EXISTS "Members can view devices" ON public.devices;

CREATE POLICY "Members can view devices"
ON public.devices
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_member_of_business(business_id));
