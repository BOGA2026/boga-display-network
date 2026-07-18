-- Backfill platform admins from allowlist and ensure trigger fires for future signups
INSERT INTO public.platform_admins (user_id)
SELECT u.id
FROM auth.users u
JOIN public.platform_admin_allowlist a ON lower(a.email) = lower(u.email)
WHERE u.email_confirmed_at IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

DROP TRIGGER IF EXISTS on_auth_user_admin_grant ON auth.users;
CREATE TRIGGER on_auth_user_admin_grant
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_platform_admin_if_allowed();