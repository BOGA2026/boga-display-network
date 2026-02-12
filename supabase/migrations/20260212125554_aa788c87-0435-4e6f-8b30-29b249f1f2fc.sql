
-- Schedule layers (priority-based)
CREATE TABLE public.schedule_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#8A00FF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view layers" ON public.schedule_layers FOR SELECT USING (is_member_of_business(business_id));
CREATE POLICY "Admins can insert layers" ON public.schedule_layers FOR INSERT WITH CHECK (can_manage_business(business_id));
CREATE POLICY "Admins can update layers" ON public.schedule_layers FOR UPDATE USING (can_manage_business(business_id));
CREATE POLICY "Admins can delete layers" ON public.schedule_layers FOR DELETE USING (can_manage_business(business_id));

CREATE TRIGGER update_schedule_layers_updated_at BEFORE UPDATE ON public.schedule_layers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Schedule blocks
CREATE TABLE public.schedule_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  screen_id uuid NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  layer_id uuid NOT NULL REFERENCES public.schedule_layers(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  start_time time NOT NULL,
  end_time time NOT NULL,
  days_of_week integer[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}',
  start_date date,
  end_date date,
  is_enabled boolean NOT NULL DEFAULT true,
  recurrence text DEFAULT 'weekly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view blocks" ON public.schedule_blocks FOR SELECT USING (is_member_of_business(business_id));
CREATE POLICY "Admins can insert blocks" ON public.schedule_blocks FOR INSERT WITH CHECK (can_manage_business(business_id));
CREATE POLICY "Admins can update blocks" ON public.schedule_blocks FOR UPDATE USING (can_manage_business(business_id));
CREATE POLICY "Admins can delete blocks" ON public.schedule_blocks FOR DELETE USING (can_manage_business(business_id));

CREATE TRIGGER update_schedule_blocks_updated_at BEFORE UPDATE ON public.schedule_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Schedule templates
CREATE TABLE public.schedule_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  json_definition jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view templates" ON public.schedule_templates FOR SELECT USING (is_member_of_business(business_id));
CREATE POLICY "Admins can insert templates" ON public.schedule_templates FOR INSERT WITH CHECK (can_manage_business(business_id));
CREATE POLICY "Admins can update templates" ON public.schedule_templates FOR UPDATE USING (can_manage_business(business_id));
CREATE POLICY "Admins can delete templates" ON public.schedule_templates FOR DELETE USING (can_manage_business(business_id));

CREATE TRIGGER update_schedule_templates_updated_at BEFORE UPDATE ON public.schedule_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add schedule_version to screens for player sync
ALTER TABLE public.screens ADD COLUMN IF NOT EXISTS schedule_version integer NOT NULL DEFAULT 1;
