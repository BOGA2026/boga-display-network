ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS heartbeat_token text;
CREATE INDEX IF NOT EXISTS idx_devices_heartbeat_token ON public.devices(heartbeat_token) WHERE heartbeat_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_devices_device_code ON public.devices(device_code);
CREATE INDEX IF NOT EXISTS idx_screens_last_seen ON public.screens(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_screen_commands_pending ON public.screen_commands(screen_id, status) WHERE status = 'pending';