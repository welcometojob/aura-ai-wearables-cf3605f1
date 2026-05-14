-- Helper to check if a user has at least one delivered order
CREATE OR REPLACE FUNCTION public.can_user_review(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN auth.users u ON lower(u.email) = lower(o.customer_email)
    WHERE u.id = _user_id
      AND o.stage >= 3
  );
$$;

-- Tighten review insert policy: must be a verified buyer
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

CREATE POLICY "Verified buyers can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.can_user_review(auth.uid())
);