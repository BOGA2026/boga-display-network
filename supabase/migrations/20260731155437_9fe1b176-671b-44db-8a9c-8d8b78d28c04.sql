-- =====================================================================
-- VISUALIA — Telemetría para Analíticas (corregida: content, no content_items)
-- =====================================================================

-- 1. HEARTBEATS
create table if not exists public.screen_heartbeats (
  screen_id   uuid        not null references public.screens(id) on delete cascade,
  ts          timestamptz not null default now(),
  app_version text,
  cpu_pct     smallint,
  mem_pct     smallint,
  net_kbps    integer,
  primary key (screen_id, ts)
);

grant select on public.screen_heartbeats to authenticated;
grant all on public.screen_heartbeats to service_role;
alter table public.screen_heartbeats enable row level security;

create index if not exists idx_heartbeats_ts_brin
  on public.screen_heartbeats using brin (ts) with (pages_per_range = 32);
create index if not exists idx_heartbeats_screen_ts
  on public.screen_heartbeats (screen_id, ts desc);

create policy "members read heartbeats"
  on public.screen_heartbeats for select to authenticated
  using (exists (
    select 1 from public.screens s
    join public.locations l on l.id = s.location_id
    where s.id = screen_heartbeats.screen_id
      and public.is_member_of_business(l.business_id)
  ));

-- 2. REPRODUCCIONES — apunta a public.content (archivos)
create table if not exists public.playback_events (
  id          bigserial   primary key,
  screen_id   uuid        not null references public.screens(id) on delete cascade,
  content_id  uuid        references public.content(id) on delete set null,
  playlist_id uuid        references public.playlists(id) on delete set null,
  started_at  timestamptz not null,
  duration_ms integer     not null check (duration_ms >= 0),
  interrupted boolean     not null default false,
  created_at  timestamptz not null default now()
);

grant select on public.playback_events to authenticated;
grant all on public.playback_events to service_role;
alter table public.playback_events enable row level security;

create index if not exists idx_playback_content_id
  on public.playback_events (content_id);
create index if not exists idx_playback_screen_started
  on public.playback_events (screen_id, started_at desc);
create index if not exists idx_playback_started_brin
  on public.playback_events using brin (started_at) with (pages_per_range = 32);

create policy "members read playback"
  on public.playback_events for select to authenticated
  using (exists (
    select 1 from public.screens s
    join public.locations l on l.id = s.location_id
    where s.id = playback_events.screen_id
      and public.is_member_of_business(l.business_id)
  ));

-- 3. ROLLUP DIARIO DE UPTIME
create table if not exists public.daily_screen_uptime (
  screen_id        uuid not null references public.screens(id) on delete cascade,
  day              date not null,
  minutes_online   integer not null default 0 check (minutes_online >= 0),
  minutes_expected integer not null default 1440 check (minutes_expected > 0),
  created_at       timestamptz not null default now(),
  primary key (screen_id, day)
);

grant select on public.daily_screen_uptime to authenticated;
grant all on public.daily_screen_uptime to service_role;
alter table public.daily_screen_uptime enable row level security;

create policy "members read uptime"
  on public.daily_screen_uptime for select to authenticated
  using (exists (
    select 1 from public.screens s
    join public.locations l on l.id = s.location_id
    where s.id = daily_screen_uptime.screen_id
      and public.is_member_of_business(l.business_id)
  ));

create or replace function public.rollup_screen_uptime(p_day date default (current_date - 1))
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  insert into daily_screen_uptime (screen_id, day, minutes_online, minutes_expected)
  select h.screen_id, p_day, least(1440, count(distinct date_trunc('minute', h.ts))::int), 1440
  from screen_heartbeats h
  where h.ts >= p_day::timestamptz and h.ts < (p_day + 1)::timestamptz
  group by h.screen_id
  on conflict (screen_id, day) do update
    set minutes_online = excluded.minutes_online,
        minutes_expected = excluded.minutes_expected;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- 4. REPORTES
create or replace function public.analytics_overview(p_business_id uuid, p_from timestamptz, p_to timestamptz)
returns table (
  screens_total   bigint,
  screens_online  bigint,
  uptime_pct      numeric,
  playbacks       bigint,
  total_play_ms   bigint
)
language sql stable security invoker set search_path = public as $$
  with biz_screens as (
    select s.id, s.status
    from screens s
    join locations l on l.id = s.location_id
    where l.business_id = p_business_id
  )
  select
    (select count(*) from biz_screens),
    (select count(*) from biz_screens where status = 'online'),
    coalesce((
      select round(avg(u.minutes_online::numeric / nullif(u.minutes_expected, 0) * 100), 1)
      from daily_screen_uptime u
      where u.screen_id in (select id from biz_screens)
        and u.day >= p_from::date and u.day < p_to::date
    ), 0),
    coalesce((
      select count(*) from playback_events pe
      where pe.screen_id in (select id from biz_screens)
        and pe.started_at >= p_from and pe.started_at < p_to
    ), 0),
    coalesce((
      select sum(pe.duration_ms)::bigint from playback_events pe
      where pe.screen_id in (select id from biz_screens)
        and pe.started_at >= p_from and pe.started_at < p_to
    ), 0);
$$;

create or replace function public.analytics_top_content(p_business_id uuid, p_from timestamptz, p_to timestamptz, p_limit integer default 10)
returns table (
  content_id       uuid,
  name             text,
  thumbnail_url    text,
  duration_seconds integer,
  playbacks        bigint,
  total_ms         bigint
)
language sql stable security invoker set search_path = public as $$
  select
    c.id,
    c.name,
    c.thumbnail_url,
    c.duration_seconds,
    count(*)::bigint,
    coalesce(sum(pe.duration_ms), 0)::bigint
  from playback_events pe
  join content c on c.id = pe.content_id
  join screens s on s.id = pe.screen_id
  join locations l on l.id = s.location_id
  where l.business_id = p_business_id
    and pe.started_at >= p_from and pe.started_at < p_to
  group by c.id, c.name, c.thumbnail_url, c.duration_seconds
  order by 5 desc
  limit coalesce(p_limit, 10);
$$;

create or replace function public.analytics_screen_table(p_business_id uuid, p_from timestamptz, p_to timestamptz)
returns table (
  screen_id    uuid,
  name         text,
  location     text,
  uptime_pct   numeric,
  playbacks    bigint,
  last_seen_at timestamptz,
  status       text
)
language sql stable security invoker set search_path = public as $$
  select
    s.id,
    s.name,
    coalesce(l.name, 'Sin sede'),
    coalesce(round(avg(u.minutes_online::numeric / nullif(u.minutes_expected, 0) * 100), 1), 0),
    coalesce(p.n, 0),
    s.last_seen_at,
    s.status
  from screens s
  join locations l on l.id = s.location_id
  left join daily_screen_uptime u
    on u.screen_id = s.id and u.day >= p_from::date and u.day < p_to::date
  left join lateral (
    select count(*) n from playback_events pe
    where pe.screen_id = s.id
      and pe.started_at >= p_from and pe.started_at < p_to
      and not pe.interrupted
  ) p on true
  where l.business_id = p_business_id
  group by s.id, s.name, l.name, s.last_seen_at, s.status, p.n
  order by 4 desc, s.name;
$$;

-- 5. DATOS DEMO
alter table public.businesses
  add column if not exists demo_data_seeded_at timestamptz;

create or replace function public.seed_demo_analytics(p_business_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s record; d date;
begin
  if not public.can_manage_business(p_business_id) then
    raise exception 'not allowed';
  end if;
  for s in
    select sc.id from screens sc
    join locations l on l.id = sc.location_id
    where l.business_id = p_business_id
  loop
    for d in select generate_series(current_date - 13, current_date - 1, interval '1 day')::date loop
      insert into daily_screen_uptime (screen_id, day, minutes_online, minutes_expected)
      values (s.id, d, 1380 + floor(random() * 60)::int, 1440)
      on conflict do nothing;
    end loop;
  end loop;
  update businesses set demo_data_seeded_at = now() where id = p_business_id;
end;
$$;

create or replace function public.purge_demo_analytics(p_business_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_business(p_business_id) then
    raise exception 'not allowed';
  end if;
  delete from daily_screen_uptime
  where screen_id in (
    select sc.id from screens sc join locations l on l.id = sc.location_id
    where l.business_id = p_business_id
  );
  delete from playback_events
  where screen_id in (
    select sc.id from screens sc join locations l on l.id = sc.location_id
    where l.business_id = p_business_id
  );
  update businesses set demo_data_seeded_at = null where id = p_business_id;
end;
$$;