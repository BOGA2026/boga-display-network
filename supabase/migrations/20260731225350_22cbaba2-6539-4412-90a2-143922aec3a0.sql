create index if not exists idx_schedule_blocks_business on public.schedule_blocks (business_id);
create index if not exists idx_schedule_blocks_screen on public.schedule_blocks (screen_id);
create index if not exists idx_subscriptions_business on public.subscriptions (business_id);