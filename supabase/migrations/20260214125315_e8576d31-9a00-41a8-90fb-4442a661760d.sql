-- Secure demo_requests: only admins can read submitted requests
CREATE POLICY "Only admins can view demo requests"
ON public.demo_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
