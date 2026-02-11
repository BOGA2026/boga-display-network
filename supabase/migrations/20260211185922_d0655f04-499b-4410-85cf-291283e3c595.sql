
-- Fix permissive INSERT policy on businesses
DROP POLICY "Anyone can create a business on signup" ON public.businesses;
CREATE POLICY "Authenticated users can create a business" ON public.businesses FOR INSERT TO authenticated WITH CHECK (true);
