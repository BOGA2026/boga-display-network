revoke execute on function public.rollup_screen_uptime(date) from anon, authenticated;
revoke execute on function public.seed_demo_analytics(uuid) from anon;
revoke execute on function public.purge_demo_analytics(uuid) from anon;
revoke execute on function public.analytics_overview(uuid, timestamptz, timestamptz) from anon;
revoke execute on function public.analytics_top_content(uuid, timestamptz, timestamptz, integer) from anon;
revoke execute on function public.analytics_screen_table(uuid, timestamptz, timestamptz) from anon;