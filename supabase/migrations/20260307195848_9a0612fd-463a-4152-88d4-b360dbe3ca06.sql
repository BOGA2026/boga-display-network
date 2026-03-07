
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  company text,
  screens int not null default 1,
  goal text,
  budget text,
  preferred_contact text check (preferred_contact in ('chatbot','asesor')),
  status text not null default 'nuevo',
  source text not null default 'chatbot_visualia',
  created_at timestamptz default now()
);

create table if not exists public.lead_events (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,
  step text not null,
  answer text,
  created_at timestamptz default now()
);

create table if not exists public.advisor_notifications (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,
  payload jsonb not null,
  channel text not null default 'webhook',
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  send_after timestamptz not null,
  sent_at timestamptz
);

alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.advisor_notifications enable row level security;

create policy "admin read leads" on public.leads
for select using (
  exists (
    select 1 from public.business_memberships
    where user_id = auth.uid() and role = 'admin'
  )
);

create policy "admin read lead_events" on public.lead_events
for select using (
  exists (
    select 1 from public.business_memberships
    where user_id = auth.uid() and role = 'admin'
  )
);

create policy "admin read notifications" on public.advisor_notifications
for select using (
  exists (
    select 1 from public.business_memberships
    where user_id = auth.uid() and role = 'admin'
  )
);

create policy "deny direct lead insert" on public.leads
for insert with check (false);

create policy "deny direct lead_events insert" on public.lead_events
for insert with check (false);

create policy "deny direct notifications insert" on public.advisor_notifications
for insert with check (false);
