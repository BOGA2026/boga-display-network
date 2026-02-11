
-- =============================================
-- PHASE 1: ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'content_editor');

-- =============================================
-- PHASE 2: BASE TABLES
-- =============================================

-- Businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Business memberships (roles)
CREATE TABLE public.business_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'content_editor',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

-- Locations
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Screens
CREATE TABLE public.screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline',
  device_token TEXT UNIQUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  file_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 10,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Playlists
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Playlist items
CREATE TABLE public.playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schedules
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- PHASE 3: HELPER FUNCTIONS (security definer)
-- =============================================

-- Get user's business ID
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Check membership in a business
CREATE OR REPLACE FUNCTION public.is_member_of_business(_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid() AND business_id = _business_id
  )
$$;

-- Check if user has a specific role in their business
CREATE OR REPLACE FUNCTION public.has_role_in_business(_business_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid() AND business_id = _business_id AND role = _role
  )
$$;

-- Can manage business (admin only)
CREATE OR REPLACE FUNCTION public.can_manage_business(_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid() AND business_id = _business_id AND role = 'admin'
  )
$$;

-- Can manage locations/screens (admin or manager)
CREATE OR REPLACE FUNCTION public.can_manage_locations_screens(_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid() AND business_id = _business_id AND role IN ('admin', 'manager')
  )
$$;

-- Can manage content/playlists (admin or content_editor)
CREATE OR REPLACE FUNCTION public.can_manage_content_playlists(_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE user_id = auth.uid() AND business_id = _business_id AND role IN ('admin', 'content_editor')
  )
$$;

-- =============================================
-- PHASE 4: TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_screens_updated_at BEFORE UPDATE ON public.screens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PHASE 5: ENABLE RLS
-- =============================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PHASE 6: RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can view business members" ON public.profiles FOR SELECT USING (
  business_id IS NOT NULL AND business_id = public.get_user_business_id()
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "System creates profiles" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- BUSINESSES
CREATE POLICY "Members can view their business" ON public.businesses FOR SELECT USING (public.is_member_of_business(id));
CREATE POLICY "Admins can update their business" ON public.businesses FOR UPDATE USING (public.can_manage_business(id));
CREATE POLICY "Anyone can create a business on signup" ON public.businesses FOR INSERT WITH CHECK (true);

-- BUSINESS MEMBERSHIPS
CREATE POLICY "Members can view memberships" ON public.business_memberships FOR SELECT USING (public.is_member_of_business(business_id));
CREATE POLICY "Admins can manage memberships" ON public.business_memberships FOR INSERT WITH CHECK (public.can_manage_business(business_id) AND user_id != auth.uid());
CREATE POLICY "Self membership on signup" ON public.business_memberships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can delete memberships" ON public.business_memberships FOR DELETE USING (public.can_manage_business(business_id) AND user_id != auth.uid());

-- LOCATIONS
CREATE POLICY "Members can view locations" ON public.locations FOR SELECT USING (public.is_member_of_business(business_id));
CREATE POLICY "Admin/Manager can insert locations" ON public.locations FOR INSERT WITH CHECK (public.can_manage_locations_screens(business_id));
CREATE POLICY "Admin/Manager can update locations" ON public.locations FOR UPDATE USING (public.can_manage_locations_screens(business_id));
CREATE POLICY "Admin/Manager can delete locations" ON public.locations FOR DELETE USING (public.can_manage_locations_screens(business_id));

-- SCREENS
CREATE POLICY "Members can view screens" ON public.screens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.locations l WHERE l.id = location_id AND public.is_member_of_business(l.business_id))
);
CREATE POLICY "Admin/Manager can insert screens" ON public.screens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.locations l WHERE l.id = location_id AND public.can_manage_locations_screens(l.business_id))
);
CREATE POLICY "Admin/Manager can update screens" ON public.screens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.locations l WHERE l.id = location_id AND public.can_manage_locations_screens(l.business_id))
);
CREATE POLICY "Admin/Manager can delete screens" ON public.screens FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.locations l WHERE l.id = location_id AND public.can_manage_locations_screens(l.business_id))
);

-- CONTENT
CREATE POLICY "Members can view content" ON public.content FOR SELECT USING (public.is_member_of_business(business_id));
CREATE POLICY "Admin/Editor can insert content" ON public.content FOR INSERT WITH CHECK (public.can_manage_content_playlists(business_id));
CREATE POLICY "Admin/Editor can update content" ON public.content FOR UPDATE USING (public.can_manage_content_playlists(business_id));
CREATE POLICY "Admin/Editor can delete content" ON public.content FOR DELETE USING (public.can_manage_content_playlists(business_id));

-- PLAYLISTS
CREATE POLICY "Members can view playlists" ON public.playlists FOR SELECT USING (public.is_member_of_business(business_id));
CREATE POLICY "Admin/Editor can insert playlists" ON public.playlists FOR INSERT WITH CHECK (public.can_manage_content_playlists(business_id));
CREATE POLICY "Admin/Editor can update playlists" ON public.playlists FOR UPDATE USING (public.can_manage_content_playlists(business_id));
CREATE POLICY "Admin/Editor can delete playlists" ON public.playlists FOR DELETE USING (public.can_manage_content_playlists(business_id));

-- PLAYLIST ITEMS
CREATE POLICY "Members can view playlist items" ON public.playlist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND public.is_member_of_business(p.business_id))
);
CREATE POLICY "Admin/Editor can insert playlist items" ON public.playlist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND public.can_manage_content_playlists(p.business_id))
);
CREATE POLICY "Admin/Editor can update playlist items" ON public.playlist_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND public.can_manage_content_playlists(p.business_id))
);
CREATE POLICY "Admin/Editor can delete playlist items" ON public.playlist_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND public.can_manage_content_playlists(p.business_id))
);

-- SCHEDULES
CREATE POLICY "Members can view schedules" ON public.schedules FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.screens s
    JOIN public.locations l ON l.id = s.location_id
    WHERE s.id = screen_id AND public.is_member_of_business(l.business_id)
  )
);
CREATE POLICY "Admins can insert schedules" ON public.schedules FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.screens s
    JOIN public.locations l ON l.id = s.location_id
    WHERE s.id = screen_id AND public.can_manage_business(l.business_id)
  )
);
CREATE POLICY "Admins can update schedules" ON public.schedules FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.screens s
    JOIN public.locations l ON l.id = s.location_id
    WHERE s.id = screen_id AND public.can_manage_business(l.business_id)
  )
);
CREATE POLICY "Admins can delete schedules" ON public.schedules FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.screens s
    JOIN public.locations l ON l.id = s.location_id
    WHERE s.id = screen_id AND public.can_manage_business(l.business_id)
  )
);

-- =============================================
-- PHASE 7: INDEXES
-- =============================================

CREATE INDEX idx_profiles_business ON public.profiles(business_id);
CREATE INDEX idx_memberships_user ON public.business_memberships(user_id);
CREATE INDEX idx_memberships_business ON public.business_memberships(business_id);
CREATE INDEX idx_locations_business ON public.locations(business_id);
CREATE INDEX idx_screens_location ON public.screens(location_id);
CREATE INDEX idx_content_business ON public.content(business_id);
CREATE INDEX idx_playlists_business ON public.playlists(business_id);
CREATE INDEX idx_playlist_items_playlist ON public.playlist_items(playlist_id);
CREATE INDEX idx_schedules_screen ON public.schedules(screen_id);
CREATE INDEX idx_schedules_playlist ON public.schedules(playlist_id);
