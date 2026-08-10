REVOKE ALL ON FUNCTION public.soft_delete_screens(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.restore_screens(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_screens(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_screens(uuid[]) TO authenticated;