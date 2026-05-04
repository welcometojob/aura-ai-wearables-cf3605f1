-- 1) Prevent privilege escalation: restrictive policies on user_roles for non-admins
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Lock down direct API execution of has_role (RLS policies still work because
--    SECURITY DEFINER functions execute with the function owner's privileges).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Same hardening for the other SECURITY DEFINER helper exposed via the API
REVOKE EXECUTE ON FUNCTION public.consume_credit(integer, text) FROM PUBLIC, anon;
-- consume_credit must remain callable by signed-in users; keep authenticated grant
GRANT EXECUTE ON FUNCTION public.consume_credit(integer, text) TO authenticated;

-- 3) Add missing UPDATE policy on review-images storage bucket (owner only)
CREATE POLICY "Users can update their own review images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'review-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'review-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);