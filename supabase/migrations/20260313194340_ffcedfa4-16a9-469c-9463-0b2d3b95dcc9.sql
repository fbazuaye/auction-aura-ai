
-- Allow admins to update vehicle status (approve/reject)
-- The existing policy already covers this via has_role check.
-- Allow admins to also update auctions status
DROP POLICY IF EXISTS "Admins can update auctions" ON public.auctions;
CREATE POLICY "Admins can update auctions" ON public.auctions FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.seller_id = auth.uid()
  )
);
