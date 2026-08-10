ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS width int,
  ADD COLUMN IF NOT EXISTS height int;

CREATE OR REPLACE FUNCTION public.get_content_page()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'content', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from (
        select c.id, c.name, c.type, c.file_url, c.thumbnail_url,
               c.duration_seconds, c.file_size_bytes, c.thumbnail_status,
               c.width, c.height,
               c.expires_at, c.created_at
        from content c
      ) t
    ), '[]'::jsonb),
    'playlists', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from (
        select pl.id, pl.name, pl.created_at,
               (select count(*) from playlist_items pi where pi.playlist_id = pl.id) as items_count
        from playlists pl
      ) t
    ), '[]'::jsonb)
  );
$function$;