-- Remove broad SELECT on storage.objects for the three public buckets to prevent listing.
-- Files are still publicly served by the Storage CDN because the buckets are public.
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Ready designs public read" ON storage.objects;
DROP POLICY IF EXISTS "Review images are publicly accessible" ON storage.objects;

-- Revoke EXECUTE on internal trigger-only functions from the API roles
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;