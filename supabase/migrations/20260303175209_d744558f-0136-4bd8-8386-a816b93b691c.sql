
-- Table for queuing commands to devices (used with Supabase Realtime)
CREATE TABLE public.screen_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id uuid NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  command text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '5 minutes')
);

-- Enable RLS
ALTER TABLE public.screen_commands ENABLE ROW LEVEL SECURITY;

-- Members can view commands for their screens
CREATE POLICY "Members can view screen commands"
  ON public.screen_commands FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM screens s
      JOIN locations l ON l.id = s.location_id
      WHERE s.id = screen_commands.screen_id
      AND is_member_of_business(l.business_id)
    )
  );

-- Admin/Manager can insert commands
CREATE POLICY "Admin/Manager can insert screen commands"
  ON public.screen_commands FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM screens s
      JOIN locations l ON l.id = s.location_id
      WHERE s.id = screen_commands.screen_id
      AND can_manage_locations_screens(l.business_id)
    )
  );

-- Admin/Manager can update commands (for marking as executed)
CREATE POLICY "Admin/Manager can update screen commands"
  ON public.screen_commands FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM screens s
      JOIN locations l ON l.id = s.location_id
      WHERE s.id = screen_commands.screen_id
      AND can_manage_locations_screens(l.business_id)
    )
  );

-- Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.screen_commands;

-- Add last_sync_at column to screens if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'screens' AND column_name = 'last_sync_at'
  ) THEN
    ALTER TABLE public.screens ADD COLUMN last_sync_at timestamptz;
  END IF;
END $$;
