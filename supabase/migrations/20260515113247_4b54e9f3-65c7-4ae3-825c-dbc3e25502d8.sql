-- Tabla de items dentro de un contenido (para que el agente pueda cambiar precios individuales)
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'COP',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_items_content_id ON public.content_items(content_id);
CREATE INDEX idx_content_items_business_id ON public.content_items(business_id);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view content items"
  ON public.content_items FOR SELECT
  USING (is_member_of_business(business_id));

CREATE POLICY "Admin/Editor can insert content items"
  ON public.content_items FOR INSERT
  WITH CHECK (can_manage_content_playlists(business_id));

CREATE POLICY "Admin/Editor can update content items"
  ON public.content_items FOR UPDATE
  USING (can_manage_content_playlists(business_id));

CREATE POLICY "Admin/Editor can delete content items"
  ON public.content_items FOR DELETE
  USING (can_manage_content_playlists(business_id));

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auditoria de acciones del agente de voz
CREATE TABLE public.voice_agent_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_agent_actions_business_id ON public.voice_agent_actions(business_id, created_at DESC);

ALTER TABLE public.voice_agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view voice actions"
  ON public.voice_agent_actions FOR SELECT
  USING (is_member_of_business(business_id));

CREATE POLICY "Members can insert their voice actions"
  ON public.voice_agent_actions FOR INSERT
  WITH CHECK (is_member_of_business(business_id) AND user_id = auth.uid());