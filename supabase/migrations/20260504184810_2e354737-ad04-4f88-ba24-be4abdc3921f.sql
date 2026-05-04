-- Force revoke EXECUTE on all SECURITY DEFINER functions from API roles
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_credit(integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- consume_credit must remain callable by signed-in users (it's an RPC)
GRANT EXECUTE ON FUNCTION public.consume_credit(integer, text) TO authenticated;